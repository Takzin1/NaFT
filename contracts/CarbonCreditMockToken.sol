// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CarbonCreditMockToken — カーボンクレジット候補のモックトークン（PoC雛形 / ERC-1155）
 *
 * ⚠️ 重要（コンプライアンス）
 * - 本トークンは「カーボンクレジット候補」の識別・数量管理を試験するモックであり、
 *   J-クレジット等の認証済みクレジット・排出枠・金融商品を表章しません。
 * - テストネット専用。実売買・実償却・価格付けは行いません。
 *
 * tokenId = NaFT 側プロジェクトID（carbon_projects.id）に対応。
 * metadataURI にはプロジェクト情報（算定方法・証憑ハッシュ等）を格納する想定。
 */
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditMockToken is ERC1155, Ownable {
    // tokenId => メタデータURI（IPFS等を想定）
    mapping(uint256 => string) private _tokenURIs;
    // tokenId => 累計償却（retire）量。数量単位は kg-CO2 相当（PoC定義）
    mapping(uint256 => uint256) public totalRetired;

    event CreditMinted(uint256 indexed tokenId, address indexed to, uint256 amount, string metadataURI);
    event CreditRetired(uint256 indexed tokenId, address indexed holder, uint256 amount, string reason);

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    /// 承認済みプロジェクトに対応するクレジット候補をミント（PoC運営者のみ）
    function mintCredit(address to, uint256 tokenId, uint256 amount, string calldata metadataURI)
        external onlyOwner
    {
        _mint(to, tokenId, amount, "");
        if (bytes(metadataURI).length > 0) _tokenURIs[tokenId] = metadataURI;
        emit CreditMinted(tokenId, to, amount, metadataURI);
    }

    /// 償却（retire）：保有分をバーンし、償却量として記録（PoCでは意味付けのみ）
    function retire(uint256 tokenId, uint256 amount, string calldata reason) external {
        _burn(msg.sender, tokenId, amount);
        totalRetired[tokenId] += amount;
        emit CreditRetired(tokenId, msg.sender, amount, reason);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}
