import { TokenMapAck } from "../generated/TokenManager/TokenManager";
import { ERC20 } from "../generated/TokenManager/ERC20";
import { TokenDetail } from "../generated/schema";
import {
  Address,
  log,
  BigInt,
  Bytes,
  ByteArray,
} from "@graphprotocol/graph-ts";

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
  log.warning("Token address at {}", [tokenAddress.toHex()]);
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
    tokenObject.totalLocked = totalLocked.value;
  }

  if (!network.reverted) {
    log.warning("NETWORK VALUE", [network.value.toString()]);
    tokenObject.network = network.value ? "ETHEREUM" : "BINANCE";
  }

  return tokenObject;
}

export function handleTokenMapAck(event: TokenMapAck): void {
  log.warning("Parsing TokensBridged for txHash {}", [
    event.transaction.hash.toHexString(),
  ]);
  log.warning("tokenReq", [event.params.tokenReq.toString()]);
  log.warning("tokenAck", [event.params.tokenAck.toString()]);
  let tokenDetails = new TokenDetail(event.transaction.from.toHex());
  tokenDetails.hrc20Address = event.params.tokenAck;
  tokenDetails.erc20Address = event.params.tokenReq;

  let hrcToken = getToken(event.params.tokenAck);

  log.warning("HRCToken {}", [hrcToken.name, hrcToken.symbol]);

  tokenDetails.name = hrcToken.name;
  tokenDetails.symbol = hrcToken.symbol;
  tokenDetails.decimals = hrcToken.decimals;
  tokenDetails.totalLocked = hrcToken.totalLocked;
  tokenDetails.network = hrcToken.network;

  tokenDetails.save();
}
