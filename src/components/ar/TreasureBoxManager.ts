import { Dispatch } from 'redux';
import { findTreasure } from '../../store/gameSlice';
import { showTreasureFoundEffect } from '../../utils/arUtils';

/**
 * 宝箱関連の処理を管理するクラス
 */
export class TreasureBoxManager {
    private dispatch: Dispatch;
    private treasureBoxes: Array<{ x: number, y: number, z: number, found: boolean }>;
    private lastClickedBox: number | null = null;
    private demoBoxClickCount: number = 0;

    /**
     * コンストラクタ
     * @param dispatch Reduxディスパッチ関数
     * @param treasureBoxes 宝箱の配列
     */
    constructor(
        dispatch: Dispatch,
        treasureBoxes: Array<{ x: number, y: number, z: number, found: boolean }>
    ) {
        this.dispatch = dispatch;
        this.treasureBoxes = treasureBoxes;
    }

    /**
     * メッセージイベントを処理する
     * @param event メッセージイベント
     * @param containerRef iframeを含むコンテナのRef
     */
    handleMessage(event: MessageEvent, containerRef: React.RefObject<HTMLDivElement>) {
        if (event.data.type === 'box-click') {
            console.log('【デバッグ】メッセージ受信:', event.data);

            if (event.data.index === 999) {
                // デモ用宝箱がクリックされた場合
                this.demoBoxClickCount++;
                this.handleDemoBoxClick();
                return;
            }

            // 既に見つかっている宝箱かチェック
            if (this.treasureBoxes[event.data.index]?.found) {
                console.log('既に見つかっている宝箱です - 処理をスキップします');
                return;
            }

            // 宝箱発見イベントをディスパッチ
            console.log('【重要】findTreasureアクションをディスパッチします。index:', event.data.index);
            console.log('アクション前の宝箱状態:', JSON.stringify(this.treasureBoxes));

            // 直接ディスパッチを行う
            this.dispatch(findTreasure(event.data.index));

            console.log('findTreasureアクションがディスパッチされました');

            this.lastClickedBox = event.data.index;

            // 見つかった宝箱の数と全体の進行状況を計算
            const foundCount = this.treasureBoxes.filter(box => box.found).length + 1; // 今回見つけた分を含める
            const totalCount = this.treasureBoxes.length;

            // 視覚的フィードバックを表示
            showTreasureFoundEffect(foundCount, totalCount);

            console.log(`宝箱 ${event.data.index} がクリックされました`);

            // iframeに進行状況を通知
            const iframe = containerRef.current?.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                const progress = Math.round((foundCount / totalCount) * 100);

                iframe.contentWindow.postMessage({
                    type: 'progress-update',
                    foundCount,
                    totalCount,
                    progress
                }, '*');
            }
        }
    }

    /**
     * デモ用宝箱クリック処理
     * @returns 発見状態にした宝箱のインデックス、または null
     */
    handleDemoBoxClick(): number | null {
        // 未発見の宝箱を探す
        const notFoundIndex = this.treasureBoxes.findIndex(box => !box.found);

        if (notFoundIndex !== -1) {
            // 未発見の宝箱があれば、その宝箱を発見したことにする
            console.log(`【デバッグ】デモ用宝箱がクリックされました。宝箱 ${notFoundIndex} を発見としてマーク`);

            // Reduxアクション前の状態
            console.log('【デバッグ】アクション前の宝箱状態:', JSON.stringify(this.treasureBoxes));

            // 直接ディスパッチを行う
            this.dispatch(findTreasure(notFoundIndex));

            this.lastClickedBox = notFoundIndex;

            // 見つかった宝箱の数と全体の進行状況を計算
            const foundCount = this.treasureBoxes.filter(box => box.found).length + 1; // 今回見つけた分を含める
            const totalCount = this.treasureBoxes.length;

            // 視覚的フィードバックを表示
            showTreasureFoundEffect(foundCount, totalCount);

            return notFoundIndex;
        } else {
            console.log('デモ用宝箱がクリックされましたが、すべての宝箱が既に発見済みです');
            return null;
        }
    }

    /**
     * 最後にクリックした宝箱のインデックスを取得
     */
    getLastClickedBox(): number | null {
        return this.lastClickedBox;
    }

    /**
     * デモボックスのクリック回数を取得
     */
    getDemoBoxClickCount(): number {
        return this.demoBoxClickCount;
    }

    /**
     * 宝箱データを更新
     * @param newTreasureBoxes 新しい宝箱データ
     */
    updateTreasureBoxes(newTreasureBoxes: Array<{ x: number, y: number, z: number, found: boolean }>) {
        this.treasureBoxes = newTreasureBoxes;
    }
} 