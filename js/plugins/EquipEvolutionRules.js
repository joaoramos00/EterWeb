class EquipEvolutionRules {
    constructor() {
        this.initialize(...arguments)
    }

    static getEvolutionInfoForId(equipment) {
        // Verifique se o objeto equipamento é válido
        if (!equipment || typeof equipment.id === 'undefined') {
            console.warn("Equipamento inválido fornecido para getEvolutionInfoForId.");
            return null;
        }

        const type = equipment.wtypeId ? 'weapon' : 'armor';
        const equipId = equipment.id.toString();

        if (!$dataEvolution || !Array.isArray($dataEvolution)) {
            console.error("$dataEvolution não é um array ou está indefinido.");
            return null;
        }

        const evolutionEquipment = $dataEvolution.find(evo =>
            evo && evo.type === type && evo.equipId === equipId
        );

        // Verifique se evolutionEquipment existe e é válido
        if (!evolutionEquipment || !evolutionEquipment.equipmentEvolutionList) {
            console.warn("Nenhum equipamento de evolução encontrado para este ID.");
            return [];
        }

        let listEvolution = evolutionEquipment.equipmentEvolutionList[evolutionEquipment.level];
        listEvolution = this.addEvolutionLevelToList(evolutionEquipment, listEvolution);
        return listEvolution;
    }


    static isAllEvolutionsApplied(evolutionEquipment) {
        if (!evolutionEquipment || !evolutionEquipment.equipmentEvolutionList) {
            return false;
        }

        const currentLevelEvolutions = evolutionEquipment.equipmentEvolutionList[evolutionEquipment.level];

        // Verifica se é um array e se todos os elementos têm isApplied como true
        return Array.isArray(currentLevelEvolutions) &&
            currentLevelEvolutions.length > 0 &&
            currentLevelEvolutions.every(evolution => evolution.isApplied === true);
    }

    static addEvolutionLevelToList(evolutionEquipment, listEvolution) {
        // Verifica se todas as evoluções foram aplicadas usando o objeto evolution
        const allEvolutionsApplied = this.isAllEvolutionsApplied(evolutionEquipment);

        if (allEvolutionsApplied &&
            evolutionEquipment.equipmentEvolutionLevel &&
            evolutionEquipment.equipmentEvolutionLevel[evolutionEquipment.level]) {

            const levelEvolution = evolutionEquipment.equipmentEvolutionLevel[evolutionEquipment.level];
            if (levelEvolution) {
                listEvolution = [...listEvolution, levelEvolution];
            }
        }
        return listEvolution;
    }

    static isCostPayable(costs) {
        for (let cost of costs) {
            if ($gameParty.numItems($dataItems[cost.itemId]) < cost.amount) {
                return false;
            }
        }
        return true
    }

    static applyEvolution(selectedEvolution, equip) {
        let param = selectedEvolution.param;

        let change = selectedEvolution.change;
        this.applyChange(param, equip, change);
        this.consumeEvolutionCosts(selectedEvolution.costs);
        this.changeIsAppliedToTrue(selectedEvolution, equip);
    }

    static applyChange(param, equip, change) {
        if (param !== 'skill') {
            this.applyParamChange(equip, param, change)
        }
        if (param === 'skill') {
            this.applySkillChange(equip, change);
        }
    }

    static changeIsAppliedToTrue(selectedEvolution, equip) {
        if (!equip || !equip.id) return;

        const type = equip.wtypeId ? 'weapon' : 'armor';
        const equipId = equip.id.toString();

        // Verifica se $dataEvolution existe
        if (!$dataEvolution || !Array.isArray($dataEvolution)) return;

        const evolution = $dataEvolution.find(evo =>
            evo &&
            evo.type === type &&
            evo.equipId === equipId
        );

        if (evolution?.equipmentEvolutionList?.[evolution.level]) {
            const evoInfo = evolution.equipmentEvolutionList[evolution.level];
            if (Array.isArray(evoInfo)) {
                const other = evoInfo.find(evolutionEquipment =>
                    evolutionEquipment &&
                    evolutionEquipment.evolutionId === selectedEvolution.evolutionId
                );
                if (other) {
                    other.isApplied = true;
                }
            }
        }
    }

    static consumeEvolutionCosts(costs) {
        for (let cost of costs) {
            $gameParty.loseItem($dataItems[cost.itemId], cost.amount, true);
        }
    }

    static applyParamChange(equip, param, change) {
        switch (param) {
            case 'hpm':
                equip.params[0] += Number(change);
                break;
            case 'mpm':
                equip.params[1] += Number(change);
                break;
            case 'atk':
                equip.params[2] += Number(change);
                break;
            case 'def':
                equip.params[3] += Number(change);
                break;
            case 'mat':
                equip.params[4] += Number(change);
                break;
            case 'mdf':
                equip.params[5] += Number(change);
                break;
            case 'agi':
                equip.params[6] += Number(change);
                break;
            case 'luk':
                equip.params[7] += Number(change);
                break;
            default:
                console.warn(`Unknown parameter type: ${param}`);
        }
        $dataWeapons[equip.id] = equip;
    }

    static applySkillChange(equip, change) {
        let skill = {
            code: 43,
            dataId: Number(change),
            value: 1
        }
        equip.traits.push(skill);
        $dataWeapons[equip.id] = equip;
    }

    static evolveEquipment(selectedEquip, selectedEvolution) {
        const id = selectedEquip.id;

        this.updateDataWeapon(id, selectedEvolution);

        this.refreshEvolutionWindow(selectedEquip);
    }

    static updateDataWeapon(id, selectedEvolution) {
        Object.keys(selectedEvolution).forEach(key => {
            if (key in $dataWeapons[id]) {
                $dataWeapons[id][key] = selectedEvolution[key];
            }
        });


        $dataEvolution.find(equipment =>
            equipment.equipId === id.toString())
            .level = selectedEvolution.changeEquipmentLevel;
    }

    static refreshEvolutionWindow(selectedEquip) {
        const scene = SceneManager._scene;
        const updatedEvolutions = this.getEvolutionInfoForId(selectedEquip);
        scene._evolutionListWindow.setListItems(updatedEvolutions);
        scene._evolutionListWindow.refresh();
        scene._equipSelectionEvolutionBox.refresh()
        scene._evolutionListWindow.select(0); // Move para a primeira linha
        scene._evolutionListWindow.activate();
    }
}