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
import { Address, log } from "@graphprotocol/graph-ts";

function createToken(
  erc20Address: Address,
  hrc20Address: Address
): TokenDetail {
  let ETH_MINTING_MANAGER = Address.fromString(
    "0xbadb6897cf2e35aca73b6f37361a35eeb6f71637"
  );

  let tokenInstance = BridgedToken.bind(hrc20Address);
  log.info("Token address at {}", [hrc20Address.toHex()]);

  let tokenDetail = new TokenDetail(hrc20Address.toHex());
  tokenDetail.erc20Address = erc20Address;
  tokenDetail.hrc20Address = hrc20Address;

  let name = tokenInstance.try_name();
  let network = tokenInstance.try_isMinter(ETH_MINTING_MANAGER);
  let decimals = tokenInstance.try_decimals();
  let symbol = tokenInstance.try_symbol();
  let totalLocked = tokenInstance.try_totalSupply();

  if (!name.reverted) {
    tokenDetail.name = name.value;
  }

  if (!symbol.reverted) {
    tokenDetail.symbol = symbol.value;
  }

  if (!decimals.reverted) {
    tokenDetail.decimals = decimals.value;
  }

  if (!totalLocked.reverted) {
    log.info("TOTAL_SUPPLY {} {}", ["-> ", totalLocked.value.toString()]);
    tokenDetail.totalLocked = totalLocked.value;
  }

  if (!network.reverted) {
    log.info("NETWORK VALUE {}", [
      network.value === true ? "ETHEREUM" : "BINANCE",
    ]);
    tokenDetail.network = network.value ? "ETHEREUM" : "BINANCE";
  }

  tokenDetail.save();

  return tokenDetail;
}

export function handleTokenMapAck(event: TokenMapAck): void {
  let tokenAddress = event.params.tokenAck.toHex();
  log.info("Parsing TokenMapAck for Token {}", [tokenAddress]);
  createToken(event.params.tokenReq, event.params.tokenAck);
}

export function handleBusdBurn(event: BBurned): void {
  let tokenAddress = event.params.token.toHex();
  log.info("Parsing Binance Burned for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = createToken(
      Address.fromString("0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
      event.params.token
    );
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.minus(amount);
  tokenDetail.save();
}

export function handleBusdMint(event: BMinted): void {
  let tokenAddress = event.params.oneToken.toHex();
  log.info("Parsing Binance Minted for TOKEN {}", [tokenAddress]);
  let tokenDetail = TokenDetail.load(tokenAddress);
  if (!tokenDetail) {
    tokenDetail = createToken(
      Address.fromString("0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
      event.params.oneToken
    );
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
    tokenDetail = createToken(
      Address.fromString("0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
      event.params.ethToken
    );
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
    tokenDetail = createToken(
      Address.fromString("0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
      event.params.token
    );
  }
  let amount = event.params.amount;
  tokenDetail.totalLocked = tokenDetail.totalLocked.minus(amount);
  tokenDetail.save();
}
