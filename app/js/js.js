const http = require("http");
const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');

var collection = {};
var IndexJson;
var DeckDir =

    String.prototype.toTitleCase = function () {
        return this.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
};

Array.prototype.contains = function (array2) {
    for (var i = 0; i < this.length; i++) {
        for (var j = 0; j < array2.length; j++) {
            if (this[i] == array2[j])
                return true;
        }
    }
    return false;
};

function CloseWindow() {
    //console.log("Closing Windows");
    remote.getCurrentWindow().close();
}

function LoadIndexFile(action) {
    fs.readFile(`${__dirname}/../Cards/index.json`, async function read(err, data) {
        if (err) {
            throw err;
        }

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        action(await JSON.parse(data));          // Or put the next step in a function and invoke it
    });
}

function LoadJsonFile(action, jsonLoc, p1, p2) {
    var jsonLocation = p2 != undefined ? jsonLoc : `${__dirname}/../Cards/Json/${jsonLoc}.json`;
    console.log(jsonLocation)
    fs.readFile(jsonLocation, async function read(err, data) {
        if (err) {
            throw err;
        }

        var json = await JSON.parse(data);
        if (p1 != undefined)
            json["subCategories"] = JSON.parse(json["subCategories"]);

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        if (p1 != undefined)
            action(json, p1);          // Or put the next step in a function and invoke it
        else
            action(json);
    });
}

function InitializeCardCollection(indexJson) {
    IndexJson = indexJson;
    collection.name = "CardIndex";
    var monsters = {};
    monsters.cards = [];
    var spells = {};
    spells.cards = [];
    var traps = {};
    traps.cards = [];
    collection.categories = [monsters, spells, traps];

    //console.log(indexJson);

    for (var i = 0; i < Object.keys(indexJson).length; i++) {
        var span = document.createElement("span");
        span.classList.add("nav-group-item");
        span.id = `card-${Object.values(indexJson)[i]["cardNumber"]}`;
        span.value = Object.values(indexJson)[i];
        span.cardType = Object.values(indexJson)[i]["cardType"];
        span.name = Object.values(indexJson)[i]["name"];
        span.number = Object.values(indexJson)[i]["cardNumber"];
        span.image = `${__dirname}/../Cards/Images/${Object.values(indexJson)[i]["cardNumber"]}.png`;
        span.type = "span";
        span.jsonLocation = `${__dirname}/../Cards/Json/${Object.values(indexJson)[i]["cardNumber"]}.json`;
        var image = document.createElement("img");
        image.classList.add("icon");
        image.style.marginTop = "1px";
        image.style.width = "20px";
        image.style.height = "20px";
        switch (Object.values(indexJson)[i]["cardType"]) {
            case 1:
                image.src = "images/Monster/level_star.png";
                break;
            case 2:
                image.src = "images/Spell/spell.png";
                break;
            case 3:
                image.src = "images/Trap/trap.png";
                break;
            default:
                break;
        }
        span.appendChild(image);
        span.appendChild(document.createTextNode(Object.values(indexJson)[i]["name"]));
        span.onclick = e => {
            if (e.target.type == "span") {
                //console.log(`${e.target.name} with ID ${e.target.id} clicked`);
                UpdateShownCard(e.target);
            } else {
                UpdateShownCard(e.target.parentElement);
            }
        };
        span.ondblclick = e => {
            //if(e.button == 3) {
            if (e.target.type == "span") {
                //console.log(`${e.target.name} with ID ${e.target.id} clicked`);
                LoadJsonFile(AddCard, e.target.number, 1);
            } else {
                LoadJsonFile(AddCard, e.target.parentElement.number, 1);
            }
            //}
        };
        collection.categories[parseInt(Object.values(indexJson)[i]["cardType"]) - 1].cards.push(span);
    }
    UpdateShownCollection();
    UpdateShownCard(cardCollection.childNodes[0]);
}

//returns the string definition of a card type
function GetCardType(cardType) {
    switch (cardType) {
        case 1:
            return "monster";
        case 2:
            return "spell";
        case 3:
            return "trap";
    }
}

var cardCollection = document.getElementById("CardCollection");
var ft = document.getElementById("CardFilter");

function UpdateShownCollection(ev) {
    if (cardCollection == null) {
        cardCollection = document.getElementById("CardCollection");
    }
    if (ft == null) {
        ft = document.getElementById("CardFilter");
    }

    var filterText = ft.value.toString().toLowerCase();
    if (cardCollection != null) {
        if (cardCollection.childNodes[0] != null && cardCollection.childNodes[0].nodeName == "#text") {
            cardCollection.removeChild(cardCollection.childNodes[0]);
        }

        for (var i = 0; i < cardCollection.childElementCount; i++) {
            var childNode = cardCollection.childNodes[i];

            if (filterText != "" && //don't delete anything if there isn't a filter
                (
                    (childNode.name != null && !childNode.name.toLowerCase().includes(filterText)) //Check name isn't null & doesn't include filter text
                    || (childNode.cardType != null && childNode.cardType.toString().toLowerCase() != filterText) //Check cardType isn't null & isn't equal to filter text
                    || (childNode.cardType != null && GetCardType(childNode.cardType).toLowerCase() != filterText) //Check cardType isn't null & the string version isn't equal to filter text
                    || (childNode.number != null && !childNode.number.toString().toLowerCase().includes(filterText)) //Check number isn't null & isn't equal to filter text
                )
            ) {
                //cardCollection.removeChild(cardCollection.childNodes[i]);
                childNode.style.display = "none";
            }
        }
    }

    var loop = function (childNode) {
        if (filterText == "" || ( //if filter text is empty
            (childNode.name != null && childNode.name.toLowerCase().includes(filterText)) //check whether the name contains filtertext
            || (childNode.cardType != null && childNode.cardType.toString().toLowerCase() == filterText) //check whether the card type [1, 2, 3] == filter text
            || (childNode.cardType != null && GetCardType(childNode.cardType).toLowerCase() == filterText) //check whether the string version of card type == filter text
            || (childNode.number != null && childNode.number.toString().toLowerCase().includes(filterText)) //check whether the card number includes filter text
        )) {
            if (ev == undefined)//if the collection doesn't already contain the card add it
                cardCollection.appendChild(childNode); //add the card
            else if (childNode.style.display == "none")
                childNode.style.display = "block";
        }
    };

    if (ev == undefined)
        for (var i = 0; i < collection.categories.length; i++)
            for (var j = 0; j < collection.categories[i].cards.length; j++)
                loop(collection.categories[i].cards[j]);
    else
        for (var i = 0; i < cardCollection.childElementCount; i++)
            loop(cardCollection.childNodes[i]);
}

function UpdateShownCard(span) {
    //console.log(span.value)
    var image = document.getElementById("CardImage");
    var desc = document.getElementById("CardDescription");

    image.src = span.image;

    fs.readFile(span.jsonLocation, async function read(err, data) {
        if (err) {
            throw err;
        }

        var json = await JSON.parse(data);
        json["subCategories"] = JSON.parse(json["subCategories"]);
        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        UpdateShownCard2(span, json);        // Or put the next step in a function and invoke it
    });
}

function UpdateShownCard2(span, json) {
    var desc = document.getElementById("CardDescription");
    var number = document.getElementById("CardNumber");
    var monsterTypes = document.getElementById("CardMonsterTypes");
    var cardType = document.getElementById("CardType");
    var cardName = document.getElementById("CardName");

    //console.log(json);

    document.getElementById("CardImage").style.opacity = "1.0";
    desc.innerHTML = json["description"];
    number.innerHTML = json["cardNumber"];
    //console.log(json["subCategories"]);
    monsterTypes.innerHTML = json["subCategories"].join(", ");
    cardType.innerHTML = GetCardType(json["cardType"]).toTitleCase();
    cardName.innerHTML = json["name"];
}

var deck = [];

function AddCard(json, amount) {
    var item = deck.find(o => o.number == json["cardNumber"]);
    if (item == null) {
        var obj = {};
        obj.number = json["cardNumber"];
        obj.amount = amount;
        obj.type = parseInt(json["cardType"]);
        obj.name = json["name"];
        obj.json = json;
        deck.push(obj);
    } else {
        if (item.amount >= 3) return;
        item.amount += amount;
    }
    UpdateShownDeck();

}

function RemoveCard(json, amount) {
    var item = deck.find(o => o.number == json["cardNumber"]);
    if (item != null) {
        item.amount -= amount;
        if (item.amount <= 0) {
            deck = deck.filter(o => o !== item);
        }
    }
    UpdateShownDeck();
}

function UpdateShownDeck() {
    var holder = document.getElementById("DeckHolder");
    while (holder.childElementCount > 0) {
        holder.removeChild(holder.childNodes[0]);
    }

    var deckSize = 0;

    for (var i = 0; i < deck.length; i++) {
        deckSize += deck[i].amount;
        var navSpan = document.createElement("span");
        navSpan.classList.add("nav-group-item");
        navSpan.style.paddingLeft = "5px";
        navSpan.object = deck[i];
        navSpan.type = "span";
        var div = document.createElement("div");
        div.style.paddingLeft = "0px";
        var span = document.createElement("span");
        span.style.cssFloat = "left";
        var img = document.createElement("img");
        img.style.width = "10px";
        img.style.height = "10px";
        img.style.display = "inline";
        switch (deck[i].type) {
            case 1:
                img.src = "images/Monster/level_star.png";
                break;
            case 2:
                img.src = "images/Spell/spell.png";
                break;
            case 3:
                img.src = "images/Trap/trap.png";
                break;
        }
        var p1 = document.createElement("p");
        p1.style.display = "inline";
        p1.innerText = `${deck[i].amount} x `;
        var p2 = document.createElement("p");
        p2.style.display = "inline";
        p2.innerText = `${deck[i].name}`;

        span.appendChild(img);
        span.appendChild(p1);
        span.appendChild(p2);
        navSpan.onclick = e => {
            if (e.target.type == "span") {
                //console.log(`${e.target.name} with ID ${e.target.id} clicked`);
                UpdateShownCard(collection.categories[e.currentTarget.object.type - 1].cards.find(o => o.number == e.currentTarget.object.number));
            } else {
                UpdateShownCard(collection.categories[e.currentTarget.object.type - 1].cards.find(o => o.number == e.currentTarget.object.number));
            }
        };
        navSpan.ondblclick = e => {
            //console.log(e.currentTarget.object);
            RemoveCard(e.currentTarget.object.json, 1);
        };
        div.appendChild(span);
        navSpan.appendChild(div);
        holder.appendChild(navSpan);
    }

    document.getElementById("DeckHeader").innerText = `Deck - ${deckSize}`
}

var extras = ["Xyz", "Fusion", "Synchro"];

function SaveDeck() {
    var deckName = document.getElementById("DeckName").value;
    var extraDeck = deck.filter(o => Array.prototype.contains(o.json["subCategories"], extras));
    var mainDeck = deck.filter(o => !extraDeck.includes(o));
    //console.log(extraDeck);
    //console.log(mainDeck);
    var deckString = "";
    deckString += "#Created By [Yu-Gi-Oh Deck Builder]\n";
    deckString += "#main\n";
    for (var i = 0; i < mainDeck.length; i++) {
        var item = mainDeck[i];
        //console.log(item.json);
        for (var j = 0; j < item.amount; j++) {
            deckString += `${item.json.cardNumber}\n`;
        }
    }
    deckString += "#extra\n";
    for (var i = 0; i < extraDeck.length; i++) {
        var item = extraDeck[i];
        for (var j = 0; j < item.amount; j++) {
            deckString += `${item.json.cardNumber}\n`
        }
    }
    deckString += "!side\n";
    //console.log(deckString);
    dialog.showSaveDialog(
        {
            title: `Saving Deck '${deckName != "" ? deckName : "DECK"}'`,
            defaultPath: `*/${deckName != "" ? deckName : "DECK"}.ydk`,
            filters: [
                {name: "YGOPro Deck", extensions: ["ydk"]}
            ]
        }, function (fileName) {

            if (fileName === undefined) return;

            fs.writeFile(fileName, deckString, function (err) {
                if (err == undefined)
                    dialog.showMessageBox({title: `Deck saved to ${fileName}`, message: deckString, buttons: ["OK"]});
                else
                    dialog.showErrorBox("File Save Error", err.message);
            });

        });
}

function LoadDeck() {
    deck = [];
    UpdateShownDeck();
    dialog.showOpenDialog(
        {
            title: `Loading Deck`,
            defaultPath: `*/${"DECK"}.ydk`,
            filters: [
                {name: "YGOPro Deck", extensions: ["ydk"]}
            ]
        }, function (fileNames) {
            if (fileNames == undefined)
                return;
            var fileName = fileNames[0];
            fs.readFile(fileName, 'utf-8', function (err, data) {

                var numbers = data.split("\n").filter(o => !o.startsWith("#") && !o.startsWith("!") && o != "");
                console.log(numbers);
                for (var i = 0; i < numbers.length; i++) {
                    console.log(numbers[i]);
                    var jsonI = IndexJson.find(o => {
                        var b = parseInt(o.cardNumber) == parseInt(numbers[i]);
                        console.log(`[${o.name} ${o.cardNumber}] == ${numbers[i]} :: ${b}`);
                        return b;
                    });
                    console.log(jsonI);
                    //console.log(jsonI.cardType);
                    console.log(jsonI.cardType - 1);
                    //console.log(collection.categories[jsonI.cardType -1]);
                    var tempCard = collection.categories[jsonI.cardType - 1].cards.find(o => {
                        var b = parseInt(o.number) == parseInt(numbers[i]);
                        //console.log(`[${o.name} ${o.number}] == ${numbers[i]} :: ${b}`);
                        return b;
                    });
                    console.log(tempCard.jsonLocation);
                    LoadJsonFile(AddCard, tempCard.jsonLocation, 1, true);
                }
                UpdateShownDeck();
            });
        });
}

LoadIndexFile(InitializeCardCollection);
