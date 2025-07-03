class EquipEvolutionWindowManager {
    constructor() {
        this.scene = SceneManager._scene;
        this.onSelectionCancel = this.onSelectionCancel.bind(this);
        this.onSelectionOk = this.onSelectionOk.bind(this);
        this.onSelectionEvolutionOk = this.onSelectionEvolutionOk.bind(this);
    }

    //-----------------------------------------------------------------------------
    // Create the box that will contain the equipment which is possible to evolve
    createSelectionBox() {
        const rect = this.calculateSelectionBoxLayout();
        this.scene._equipSelectionEvolutionBox = new window.EquipSelectionBoxManager(rect);
        this.configureSelectionBoxHandlers();
        this.scene.addWindow(this.scene._equipSelectionEvolutionBox);
    }

    //-----------------------------------------------------------------------------
    // Calculate the box size for the SelectionBox
    calculateSelectionBoxLayout() {
        const ww = this.scene.mainCommandWidth();
        const wh = this.scene.calcWindowHeight(3, true);
        const wx = this.scene.isRightInputMode() ? Graphics.boxWidth - ww : 0;
        const wy = this.scene.mainAreaTop();
        return new Rectangle(wx, wy, ww, wh);
    }

    //-----------------------------------------------------------------------------
    // Configure the Handlers for the SelectionBox
    configureSelectionBoxHandlers() {
        this.scene._equipSelectionEvolutionBox.setHelpWindow(this.scene._helpWindow);
        this.scene._equipSelectionEvolutionBox.setHandler("cancel", this.scene.popScene.bind(this.scene));
        this.scene._equipSelectionEvolutionBox.setHandler("pagedown", this.scene.nextActor.bind(this.scene));
        this.scene._equipSelectionEvolutionBox.setHandler("pageup", this.scene.previousActor.bind(this.scene));
        this.scene._equipSelectionEvolutionBox.setHandler("evolution", this.onSelectionOk);
    }

    //-----------------------------------------------------------------------------
    // Create the box that will contain the Actor Status
    createStatusBox() {
        const rect = this.calculateStatusBoxLayout();
        this.scene._statusBox = new Window_SkillStatus(rect);
        this.scene.addWindow(this.scene._statusBox);
    }

    onSelectionOk() {
        const selectedEquip = this.scene._equipSelectionEvolutionBox.currentEquip();
        this.scene._evolutionListWindow.listItems = EquipEvolutionRules.getEvolutionInfoForId(selectedEquip);
        this.scene._evolutionListWindow.setListItems(this.scene._evolutionListWindow.listItems);
        this.scene._evolutionListWindow.activate()
        this.scene._evolutionListWindow.forceSelect(0);
    }

    onSelectionCancel() {
        if (!this.scene) return;
        if (this.scene._evolutionListWindow) {
            this.scene._evolutionListWindow.deselect();
        }
        if (this.scene._equipSelectionEvolutionBox) {
            this.scene._equipSelectionEvolutionBox.activate();
        }
    }

    //-----------------------------------------------------------------------------
    // Calculate the StatusBox size
    calculateStatusBoxLayout() {
        const ww = Graphics.boxWidth - this.scene.mainCommandWidth();
        const wh = this.scene._equipSelectionEvolutionBox.height;
        const wx = this.scene.isRightInputMode() ? 0 : Graphics.boxWidth - ww;
        const wy = this.scene.mainAreaTop();
        return new Rectangle(wx, wy, ww, wh);
    }

    //-----------------------------------------------------------------------------
    // Create the box that will contain the evolution options for the equipment
    createEvolutionListBox() {
        const rect = this.calculateEvolutionListBoxLayout();
        this.scene._evolutionListWindow = new EquipEvolutionListBoxManager.createEquipEvolutionListBox(rect);
        this.configureEvolutionListWindowHandlers()
        this.scene.addWindow(this.scene._evolutionListWindow);
    }

    //----------------------------------------------------------------
    // Calculate the EvolutionListBox size
    calculateEvolutionListBoxLayout() {
        const wx = 0;
        const wy = this.scene._statusBox.y + this.scene._statusBox.height;
        const ww = Graphics.boxWidth;
        const wh = this.scene.mainAreaHeight() - this.scene._statusBox.height;
        return new Rectangle(wx, wy, ww, wh);
    }

    //-----------------------------------------------------------------------------
    // Configure the Handlers for the EvolutionListBox
    configureEvolutionListWindowHandlers() {
        this.scene._evolutionListWindow.setHelpWindow(this.scene._helpWindow);
        this.scene._evolutionListWindow.setHandler("cancel", this.onSelectionCancel.bind(this.scene));
        this.scene._evolutionListWindow.setHandler("pagedown", this.scene.nextActor.bind(this.scene));
        this.scene._evolutionListWindow.setHandler("pageup", this.scene.previousActor.bind(this.scene));
        this.scene._evolutionListWindow.setHandler("ok", this.onSelectionEvolutionOk);
    }

    onSelectionEvolutionOk() {
        const selectedEvolution = this.scene._evolutionListWindow.listItems[this.scene._evolutionListWindow.index()];
        const selectedEquip = this.scene._equipSelectionEvolutionBox.currentEquip();

        if (EquipEvolutionRules.isCostPayable(selectedEvolution.costs) === true
            && selectedEvolution.isApplied === false) {

            EquipEvolutionRules.applyEvolution(selectedEvolution, selectedEquip);
            const updatedEvolutions = EquipEvolutionRules.getEvolutionInfoForId(selectedEquip);
            this.scene._evolutionListWindow.setListItems(updatedEvolutions);
        }
        if (selectedEvolution.changeEquipmentLevel != null) {
            EquipEvolutionRules.evolveEquipment(selectedEquip, selectedEvolution);
        }
        this.scene._evolutionListWindow.refresh();
        this.scene._evolutionListWindow.activate();
    }

    //-----------------------------------------------------------------------------
    // Refresh the actor in the selection box and status box
    refreshActor() {
        const actor = this.scene._actor;
        this.scene._equipSelectionEvolutionBox.setActor(actor);
        this.scene._statusBox.setActor(actor);
        this.scene._evolutionListWindow.setActor(actor);
    }
}