import { TokenMapAck } from "../generated/TokenManager/TokenManager";
import {
  Minted as BMinted,
  Burned as BBurned,
} from "../generated/BUSDHmyManager/BUSDHmyManager";
import {
  Minted as EMinted,
  Burned as EBurned,
} from "../generated/HRC20EthManager/HRC20EthManager";
import { ERC20 } from "../generated/TokenManager/ERC20";
import { TokenDetail } from "../generated/schema";
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
  let HMY_BEP20_MANAGER_CONTRACT = Address.fromString(
    "0x0de8e70e94f4761dc5baf5833d0f13eb9fd93620"
  );

  let tokenInstance = ERC20.bind(tokenAddress);
  log.info("Token address at {}", [tokenAddress.toHex()]);
  let tokenObject = new TokenObject();
  tokenObject.address = tokenAddress;

  let name = tokenInstance.try_name();
  let network = tokenInstance.try_isMinter(HMY_BEP20_MANAGER_CONTRACT);
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
  let tokenDetails = new TokenDetail(tokenAddress);
  tokenDetails.hrc20Address = event.params.tokenAck;
  tokenDetails.erc20Address = event.params.tokenReq;

  let hrcToken = getToken(event.params.tokenAck);
  log.info("HRCToken {} {}", [hrcToken.name, hrcToken.symbol]);

  tokenDetails.name = hrcToken.name;
  tokenDetails.symbol = hrcToken.symbol;
  tokenDetails.decimals = hrcToken.decimals;
  tokenDetails.totalLocked = hrcToken.totalLocked;
  tokenDetails.network = hrcToken.network;

  tokenDetails.save();
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
