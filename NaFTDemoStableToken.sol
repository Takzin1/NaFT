// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * NaFTDemoStableToken — デモステーブルトークン（PoC雛形）
 *
 * ⚠️ 重要（コンプライアンス）
 * 本コントラクトは NaFT の将来拡張を検討するための「テストネット専用の雛形」です。
 * - 法定通貨・暗号資産・電子決済手段・ステーブルコインとして発行するものではありません。
 * - 本番での価値の裏付け・償還・発行は、資金決済法等の法規制の確認と
 *   専門家・提携金融機関のレビューを経るまで行いません。
 * - メインネットへのデプロイ、および実際の金銭的価値との紐づけは禁止です。
 *
 * 依存: OpenZeppelin Contracts v5 系
 *   npm install @openzeppelin/contracts
 */
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NaFTDemoStableToken is ERC20, Ownable, Pausable {
    /// オフチェーン台帳との突合用イベント（NaFT側 offchain_transaction_id を記録）
    event OffchainLinked(bytes32 indexed offchainTxId, address indexed account, uint256 amount, string kind);

    constructor(address initialOwner)
        ERC20("NaFT Demo Stable Token (PoC)", "dJPY-DEMO")
        Ownable(initialOwner)
    {}

    /// PoC運営者のみがテスト用にミント可能
    function mint(address to, uint256 amount, bytes32 offchainTxId) external onlyOwner whenNotPaused {
        _mint(to, amount);
        emit OffchainLinked(offchainTxId, to, amount, "mint");
    }

    /// テスト用バーン（回収・実証終了時のクリーンアップ）
    function burn(address from, uint256 amount, bytes32 offchainTxId) external onlyOwner {
        _burn(from, amount);
        emit OffchainLinked(offchainTxId, from, amount, "burn");
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
