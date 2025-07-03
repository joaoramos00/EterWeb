// js/plugins/EquipSelectionBoxManager.js
//=============================================================================
// Class to manage the box that contains the equipment selection to be evolved
//

class EquipSelectionBoxManager extends Window_Command {
    constructor(rect) {
        super(rect);
        this._actor = null;
    }
    //-----------------------------------------------------------------------------
    // Set the actor to be used in the selection window
    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    //-----------------------------------------------------------------------------
    // Fill the box with the equipment that can be evolved
    makeCommandList() {
        const actor = this._actor;
        if (actor) {
            const equips = actor.equips();
            equips.forEach((item) => {
                if (item) {
                    this.addCommand(item.name, "evolution", true, { item: item });
                }
            });
        }
    }

    currentEquip(){
        const currentCommand = this.currentData();
        return currentCommand ? currentCommand.ext.item : null;
    }
}

//-----------------------------------------------------------------------------
// Export the class to be used in other files
window.EquipSelectionBoxManager = EquipSelectionBoxManager;