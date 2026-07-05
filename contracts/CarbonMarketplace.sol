// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CarbonMarketplace — クレジット候補マーケット（PoC雛形）
 *
 * ⚠️ 重要（コンプライアンス）
 * - テストネット専用の雛形です。実際の売買・決済・償却は行いません。
 * - reserveCredit は「購入予約＝意思表示」のオンチェーン記録であり、決済を伴いません。
 * - purchaseWithDemoStable はデモトークン間の交換試験であり、金銭的価値を持ちません。
 * - 本番実装は、資金決済法・金商法・クレジット制度（J-クレジット等）の
 *   専門家レビュー完了後に段階導入します。
 */
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICarbonCreditMock is IERC1155 {
    function retire(uint256 tokenId, uint256 amount, string calldata reason) external;
}

contract CarbonMarketplace is Ownable, ReentrancyGuard {
    IERC20 public immutable demoStable;        // NaFTDemoStableToken
    ICarbonCreditMock public immutable credit; // CarbonCreditMockToken

    struct Listing { uint256 unitPrice; uint256 available; bool active; }
    struct Reservation { address buyer; uint256 tokenId; uint256 quantity; uint256 createdAt; bool fulfilled; }

    mapping(uint256 => Listing) public listings;   // tokenId(=projectId) => Listing
    Reservation[] public reservations;

    event Listed(uint256 indexed tokenId, uint256 unitPrice, uint256 available);
    event CreditReserved(uint256 indexed reservationId, address indexed buyer, uint256 indexed tokenId, uint256 quantity);
    event CreditPurchased(address indexed buyer, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice);
    event CreditRetiredVia(address indexed holder, uint256 indexed tokenId, uint256 quantity, string reason);

    constructor(address initialOwner, IERC20 _demoStable, ICarbonCreditMock _credit)
        Ownable(initialOwner)
    { demoStable = _demoStable; credit = _credit; }

    /// 運営者が承認済みプロジェクトのクレジット候補を出品（PoC）
    function list(uint256 tokenId, uint256 unitPrice, uint256 available) external onlyOwner {
        listings[tokenId] = Listing(unitPrice, available, true);
        emit Listed(tokenId, unitPrice, available);
    }

    /// 購入予約（意思表示）— 決済を伴わない記録のみ
    function reserveCredit(uint256 tokenId, uint256 quantity) external returns (uint256 reservationId) {
        require(quantity > 0, "quantity=0");
        reservations.push(Reservation(msg.sender, tokenId, quantity, block.timestamp, false));
        reservationId = reservations.length - 1;
        emit CreditReserved(reservationId, msg.sender, tokenId, quantity);
    }

    /// デモステーブルでの購入試験（テストネット専用・実価値なし）
    function purchaseWithDemoStable(uint256 tokenId, uint256 quantity) external nonReentrant {
        Listing storage l = listings[tokenId];
        require(l.active && l.available >= quantity, "not available");
        uint256 total = l.unitPrice * quantity;
        l.available -= quantity;
        require(demoStable.transferFrom(msg.sender, address(this), total), "payment failed");
        credit.safeTransferFrom(address(this), msg.sender, tokenId, quantity, "");
        emit CreditPurchased(msg.sender, tokenId, quantity, total);
    }

    /// 償却の記録（保有者が実行、PoCでは意味付けのみ）
    function retireCredit(uint256 tokenId, uint256 quantity, string calldata reason) external {
        credit.safeTransferFrom(msg.sender, address(this), tokenId, quantity, "");
        credit.retire(tokenId, quantity, reason);
        emit CreditRetiredVia(msg.sender, tokenId, quantity, reason);
    }

    function reservationCount() external view returns (uint256) { return reservations.length; }
}
