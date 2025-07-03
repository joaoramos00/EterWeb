/*:
 * @target MZ
 * @plugindesc Adds a list of new commands to the main menu.
 * @author joaoramos00
 * @help
 * This plugin allows adding multiple commands to the main menu.
 *
 * For each command in the list you can configure:
 * - Name: Text shown in the menu
 * - Symbol: Unique command identifier (no spaces)
 * - Condition: JavaScript code that returns true/false to enable/disable
 * - Switch: Switch ID that enables/disables the command (0 = always active)
 *
 * @param MenuCommands
 * @text Menu Commands
 * @type struct<NewCommand>[]
 * @desc List of commands to be added to the menu
 * @default []
 */

/*~struct~NewCommand:
 * @param Name
 * @type text
 * @desc Text that will appear in the menu
 *
 * @param Symbol
 * @type text
 * @desc Unique identifier for the command (no spaces)
 *
 * @param EnableSwitch
 * @text Activation Switch
 * @desc Switch ID that enables/disables the command (0 = always active)
 * @type switch
 * @default 0
 *
 * @param SceneClass
 * @text Name of the SceneClass
 * @type SceneClass
 * @desc Name of the Scene that will be called
 * @default Scene_EquipEvolution
 *
 * @requiredAssets js/plugins/EquipEvolutionWindowManager.js
 */

var Imported = Imported || {};
Imported.ETER_MenuCommandsExtras = true;
var ETER = ETER || {};
ETER.Versions = ETER.Versions || {};
ETER.Versions['ETER MenuCommandsExtras'] = '1.0.0';

ETER.parameters = PluginManager.parameters('ETER_MenuCommandsExtras');

function ETER_MenuCommandsExtras() {
    this.initialize.apply(this, arguments);
}

ETER_MenuCommandsExtras.prototype.initialize = function () {
    this.createPluginData();
}

ETER_MenuCommandsExtras.prototype.createPluginData = function () {
}

// Improved parameter parsing
const ETER_COMMANDS = ETER.parameters['MenuCommands'] || [];

// Parse JSON parameters with error handling
const parseCommandParam = function (paramStr) {
    try {
        let commandsParameters = JSON.parse(paramStr)
        let commandsArray = [];
        if(commandsParameters !== "" ) {
            for (let commandParameter of commandsParameters) {
                commandsArray.push(JSON.parse(commandParameter));
            }
        }
        return commandsArray;

    } catch (e) {
        console.error("Failed to parse menu commands:", e);
        return [];
    }
};

// Get commands from parameters
const menuCommands = ETER_COMMANDS !== "" ?
    parseCommandParam(ETER_COMMANDS) : [];

// Store original function
const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;

// Override addOriginalCommands function
Window_MenuCommand.prototype.addOriginalCommands = function () {
    // Call the original function first
    _Window_MenuCommand_addOriginalCommands.call(this);

    // Make sure the menuCommands exists and is an array
    if (menuCommands !== []) {
        // Add each command from the list
        menuCommands.forEach(command => {
            if (command && command.Name && command.Symbol) {
                const enabled = this.isCustomCommandEnabled(command);
                this.addCommand(showName(command, enabled), command.Symbol, enabled);
            }
        });
    }
};

function showName(command, enabled) {
    return enabled ? command.Name : "???";
}
// Function to check if command should be enabled
Window_MenuCommand.prototype.isCustomCommandEnabled = function (command) {
    // Check switch if configured
    if(command.EnableSwitch === 0) {
        return true;
    }
    return (command.EnableSwitch > 0 && $gameSwitches.value(Number(command.EnableSwitch)));
};

// Add command handlers to Scene_Menu
const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function () {
    _Scene_Menu_createCommandWindow.call(this);

    // Add a handler for each command
    if (menuCommands.length > 0) {
        menuCommands.forEach(command => {
            if (command && command.Symbol) {
                this._commandWindow.setHandler(command.Symbol,
                    this.onCustomCommandSelected.bind(this, command));
            }
        });
    }
};

// Function called when a custom command is selected
Scene_Menu.prototype.onCustomCommandSelected = function () {
    this._statusWindow.setFormationMode(false);
    this._statusWindow.selectLast();
    this._statusWindow.activate();
    this._statusWindow.setHandler("ok", this.onCustomCommandOk.bind(this));
    this._statusWindow.setHandler("cancel", this.onPersonalCancel.bind(this));
};

Scene_Menu.prototype.onCustomCommandOk = function () {
    const symbol = this._commandWindow.currentSymbol();
    const command = menuCommands.find(cmd => cmd.Symbol === symbol);
    if (command && command.SceneClass) {
        SceneManager.push(window[command.SceneClass]);
    }
};

//-----------------------------------------------------------------------------
// Scene_EquipEvolution
//
// The scene class of the equipment evolution screen.

function Scene_EquipEvolution() {
    this.initialize(...arguments);
}

Scene_EquipEvolution.prototype = Object.create(Scene_ItemBase.prototype);
Scene_EquipEvolution.prototype.constructor = Scene_EquipEvolution;

Scene_EquipEvolution.prototype.initialize = function() {
    Scene_ItemBase.prototype.initialize.call(this);
};

Scene_EquipEvolution.prototype.create = function () {
    Scene_ItemBase.prototype.create.call(this);
    this.windowManager = new EquipEvolutionWindowManager(this);
    this.createHelpWindow();
    this.createEquipSelectionWindow();
    this.createStatusWindow();
    this.createEvolutionListWindow(this.windowManager);
}

Scene_EquipEvolution.prototype.start = function() {
    Scene_ItemBase.prototype.start.call(this);
    this.refreshActor();
}

// Create equip the evolution selection window
Scene_EquipEvolution.prototype.createEquipSelectionWindow = function() {
    this.windowManager.createSelectionBox();
}

// Create status the evolution selection window
Scene_EquipEvolution.prototype.createStatusWindow = function() {
    this.windowManager.createStatusBox();
}

// Create a list of evolution options for the equipment
Scene_EquipEvolution.prototype.createEvolutionListWindow = function() {
    this.windowManager.createEvolutionListBox()
}

Scene_EquipEvolution.prototype.refreshActor = function() {
    this.windowManager.refreshActor();
}

//-----------------------------------------------------------------------------
// Window_EquipEvolution
//
// The superclass of windows for displaying equip evolution.

function Window_BaseEquipEvolution() {
    this.initialize(...arguments);
}

Window_BaseEquipEvolution.prototype = Object.create(Window_Selectable.prototype);
Window_BaseEquipEvolution.prototype.constructor = Window_BaseEquipEvolution;

Window_BaseEquipEvolution.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._additionalSprites = {};
    this.loadFaceImages();
}

Window_BaseEquipEvolution.prototype.loadFaceImages = function() {
    for (const actor of $gameParty.members()) {
        ImageManager.loadFace(actor.faceName());
    }
};

Window_BaseEquipEvolution.prototype.hideAdditionalSprites = function() {
    for (const sprite of Object.values(this._additionalSprites)) {
        sprite.hide();
    }
};

Window_BaseEquipEvolution.prototype.placeActorName = function(actor, x, y) {
    const key = "actor%1-name".format(actor.actorId());
    const sprite = this.createInnerSprite(key, Sprite_Name);
    sprite.setup(actor);
    sprite.move(x, y);
    sprite.show();
};

Window_BaseEquipEvolution.prototype.createInnerSprite = function(key, spriteClass) {
    const dict = this._additionalSprites;
    if (dict[key]) {
        return dict[key];
    } else {
        const sprite = new spriteClass();
        dict[key] = sprite;
        this.addInnerChild(sprite);
        return sprite;
    }
};

// prettier-ignore
Window_BaseEquipEvolution.prototype.drawActorFace = function(
    actor, x, y, width, height
) {
    this.drawFace(actor.faceName(), actor.faceIndex(), x, y, width, height);
};

Window_BaseEquipEvolution.prototype.drawActorName = function(actor, x, y, width) {
    width = width || 168;
    this.changeTextColor(ColorManager.hpColor(actor));
    this.drawText(actor.name(), x, y, width);
};

Window_BaseEquipEvolution.prototype.drawActorSimpleStatus = function(actor, x, y) {
    this.drawActorName(actor, x, y);
};