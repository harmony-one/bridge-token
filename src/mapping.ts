import {
  Minted as BMinted,
  Burned as BBurned,
} from "../generated/BUSDHmyManager/BUSDHmyManager";
import {
  Minted as EMinted,
  Burned as EBurned,
} from "../generated/HRC20EthManager/HRC20EthManager";

import { TokenMapAck } from "../generated/TokenManager/TokenManager";
import { TokenDetail } from "../generated/schema";
import { BridgedToken } from "../generated/templates/BridgedToken/BridgedToken";
import { Address, log, BigInt } from "@graphprotocol/graph-ts";

class TokenObject {
  address: Address;
  name: string;
  symbol: string;
  decimals: i32;
  network: string;
  totalLocked: BigInt;
}

function getToken(tokenAddress: Address): TokenObject {
  let ETH_MINTING_MANAGER = Address.fromString(
    "0xbadb6897cf2e35aca73b6f37361a35eeb6f71637"
  );

  let tokenInstance = BridgedToken.bind(tokenAddress);
  log.info("Token address at {}", [tokenAddress.toHex()]);
  let tokenObject = new TokenObject();
  tokenObject.address = tokenAddress;

  let name = tokenInstance.try_name();
  let network = tokenInstance.try_isMinter(ETH_MINTING_MANAGER);
  let decimals = tokenInstance.try_decimals();
  let symbol = tokenInstance.try_symbol();
  let totalLocked = tokenInstance.try_totalSupply();

  if (!name.reverted) {
    tokenObject.name = name.value;
  }

  if (!symbol.reverted) {
    tokenObject.symbol = symbol.value;
  }

  if (!decimals.reverted) {
    tokenObject.decimals = decimals.value;
  }

  if (!totalLocked.reverted) {
    log.info("TOTAL_SUPPLY {} {}", ["-> ", totalLocked.value.toString()]);
    tokenObject.totalLocked = totalLocked.value;
  }

  if (!network.reverted) {
    log.info("NETWORK VALUE {}", [
      network.value === true ? "ETHEREUM" : "BINANCE",
    ]);
    tokenObject.network = network.value ? "ETHEREUM" : "BINANCE";
  }

  return tokenObject;
}

export function handleTokenMapAck(event: TokenMapAck): void {
  let tokenAddress = event.params.tokenAck.toHex();
  log.info("Parsing TokenMapAck for Token {}", [tokenAddress]);
  let tokenDetail = new TokenDetail(tokenAddress);
  tokenDetail.hrc20Address = event.params.tokenAck;
  tokenDetail.erc20Address = event.params.tokenReq;

  let hrcToken = getToken(event.params.tokenAck);
  log.info("HRCToken {} {}", [hrcToken.name, hrcToken.symbol]);

  tokenDetail.name = hrcToken.name;
  tokenDetail.symbol = hrcToken.symbol;
  tokenDetail.decimals = hrcToken.decimals;
  tokenDetail.totalLocked = hrcToken.totalLocked;
  tokenDetail.network = hrcToken.network;

  tokenDetail.save();
}

export function handleBusdBurn(event: BBurned): void {
  let tokenAddress = event.params.token.toHex();
  log.info("Parsing Binance Burned for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = new TokenDetail(tokenAddress);
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.minus(amount);
  tokenDetail.save();
}

export function handleBusdMint(event: BMinted): void {
  let tokenAddress = event.params.oneToken.toString();
  log.info("Parsing Binance Minted for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = new TokenDetail(tokenAddress);
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.plus(amount);
  tokenDetail.save();
}

export function handleHrc20Mint(event: EMinted): void {
  let tokenAddress = event.params.ethToken.toHex();
  log.info("Parsing Ethereum Minted for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = new TokenDetail(tokenAddress);
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.plus(amount);
  tokenDetail.save();
}

export function handleHrc20Burn(event: EBurned): void {
  let tokenAddress = event.params.token.toHex();
  log.info("Parsing Ethreum Burned for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = new TokenDetail(tokenAddress);
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.minus(amount);
  tokenDetail.save();
}
