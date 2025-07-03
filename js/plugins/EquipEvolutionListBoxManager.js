// EquipEvolutionListBoxManager.js
/* @requiredAssets js/plugins/EquipEvolutionRules.js
*/

class EquipEvolutionListBoxManager {
    constructor() {
        this._evolutionListWindow = null;
        this.scene = SceneManager._scene;
    }

    static createEquipEvolutionListBox = class extends Window_Selectable {
        constructor() {
            super(...arguments);
            this.initialize(...arguments);
        }

        initialize(rect) {
            super.initialize(rect);
            this._actor = null;
            this.listItems = [];
        }

        setActor(actor) {
            if (this._actor !== actor) {
                this._actor = actor;
                this.refresh();
                this.scrollTo(0, 0);
            }
        }

        maxItems() {
            return this.listItems ? this.listItems.length : 1;
        }

        item(index) {
            // Retorna null se o índice não for válido ou a lista estiver vazia
            return this.listItems && index >= 0 && index < this.listItems.length
                ? this.listItems[index]
                : null;
        }

        isEnabled(item) {
            if (!item) return false;
            if (item.isApplied) return false; // Already applied
            return EquipEvolutionRules.isCostPayable(item.costs);
        }

        drawItem(index) {
            const item = this.item(index);
            if (!item) return; // Se item for nulo, não faça nada

            const rect = this.itemLineRect(index);
            const isPayable = this.isEnabled(item);
            const iconWidth = ImageManager.iconWidth;
            const iconSpacing = 4;

            if (item.description && item.changeEquipmentLevel) {
                this.drawEvolutionLevel(item, rect, iconWidth, iconSpacing);
            } else {
                this.drawEvolutionItem(isPayable, item, rect);
            }
        }

        drawEvolutionItem(isPayable, item, rect) {
            this.changePaintOpacity(isPayable);
            if (!isPayable) {
                this.changePaintOpacity(item.isApplied)
            }
            const iconWidth = ImageManager.iconWidth;
            const iconSpacing = 4;
            this.drawIcon(item.isApplied ? 87 : item.iconIndex, rect.x, rect.y);

            let totalCostsWidth = 0;
            for (let cost of item.costs) {
                let itemCost = $dataItems[cost.itemId];
                if (itemCost) {
                    const costText = `${itemCost.name}: ${cost.amount}`;
                    totalCostsWidth += this.textWidth(costText) + iconWidth + iconSpacing;
                }
            }

            const descriptionWidth = rect.width - (iconWidth + iconSpacing + totalCostsWidth);
            const appliedWidth = rect.width - (2 * iconWidth + 2 * iconSpacing);
            if (item.isApplied) {
                this.drawApplied(rect, iconWidth, iconSpacing, appliedWidth, item);
            } else {
                this.drawEvolutionItemInfo(item, rect, iconWidth, iconSpacing, descriptionWidth, totalCostsWidth);
            }
        }

        drawEvolutionItemInfo(item, rect, iconWidth, iconSpacing, descriptionWidth, totalCostsWidth) {
            this.drawText(item.description, rect.x + iconWidth + iconSpacing, rect.y, descriptionWidth);

            let currentX = rect.x + rect.width - totalCostsWidth;
            for (let cost of item.costs) {
                let itemCost = $dataItems[cost.itemId];
                if (itemCost) {
                    const costText = `${itemCost.name}: ${cost.amount}`;
                    const costTextWidth = this.textWidth(costText);

                    this.drawIcon(itemCost.iconIndex, currentX, rect.y);
                    this.drawText(costText, currentX + iconWidth + iconSpacing, rect.y, costTextWidth);
                    currentX += costTextWidth + iconWidth + iconSpacing * 2;
                }
            }
        }

        drawApplied(rect, iconWidth, iconSpacing, appliedWidth, item) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Applied", rect.x + iconWidth + iconSpacing, rect.y, appliedWidth, 'center');
            this.resetTextColor();
            this.drawIcon(item.isApplied ? 87 : item.iconIndex, rect.x + rect.width - iconWidth - iconSpacing, rect.y);
        }

        drawEvolutionLevel(item, rect, iconWidth, iconSpacing) {

            this.drawIcon(item.iconIndex, rect.x, rect.y);

            const descriptionWidth = rect.width - (iconWidth + iconSpacing);
            this.drawText(item.description, rect.x + iconWidth + iconSpacing, rect.y, descriptionWidth);

            this.changeTextColor(ColorManager.systemColor());
            this.resetTextColor();

            let currentX = rect.x + rect.width - iconSpacing;
            for (let cost of item.costs) {
                let itemCost = $dataItems[cost.itemId];
                if (itemCost) {
                    const costText = `${itemCost.name}: ${cost.amount}`;
                    const costTextWidth = this.textWidth(costText);
                    currentX -= (costTextWidth + iconWidth + iconSpacing);

                    this.drawIcon(itemCost.iconIndex, currentX, rect.y);
                    this.drawText(costText, currentX + iconWidth + iconSpacing, rect.y, costTextWidth);
                }
            }
        }

        updateHelp() {
            const item = this.item(this.index());
            if (this._helpWindow) {
                this._helpWindow.setText(item ? item.help : '');
            }
        }

        setListItems(items) {
            // Verifique se os itens fornecidos são um array válido
            this.listItems = Array.isArray(items) ? items : [];
            this.refresh();
        }
    }
}