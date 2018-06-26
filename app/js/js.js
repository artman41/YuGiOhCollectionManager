const http = require("http");
const remote = require('electron').remote;
const fs = require('fs');

var collection = {};
var IndexJson;

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
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

function LoadJsonFile(action, number) {
    fs.readFile(`${__dirname}/../Cards/Json/${number}.json`, async function read(err, data) {
        if (err) {
            throw err;
        }

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        action(await JSON.parse(data));          // Or put the next step in a function and invoke it
    });
}

function LoadJsonFile(action, number, p1) {
    fs.readFile(`${__dirname}/../Cards/Json/${number}.json`, async function read(err, data) {
        if (err) {
            throw err;
        }

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        action(await JSON.parse(data), p1);          // Or put the next step in a function and invoke it
    });
}

function InitializeCardCollection(indexJson) {
    IndexJson = indexJson;
    collection.name = "CardIndex";
    var monsters = {};
    monsters.cards = [];
    var traps = {};
    traps.cards = [];
    var spells = {};
    spells.cards = [];
    collection.categories = [monsters, traps, spells];

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
    UpdateShownCollection(null);
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


    //console.log("filterText :: " + ft.value + extraChar);
    var filterText = ft.value.toString().toLowerCase();
    if (cardCollection != null) {
        if (cardCollection.childNodes[0] != null && cardCollection.childNodes[0].nodeName == "#text") {
            cardCollection.removeChild(cardCollection.childNodes[0]);
        }
        //console.log(cardCollection.childNodes);
        var removed = true;
        var i = 0;
        while (removed) {
            removed = false;
            if (cardCollection.childNodes.length == 0) break;
            if (i >= cardCollection.childElementCount) {
                i = 0;
            }
            var childNode = cardCollection.childNodes[i];

            //if(filterText != null) console.log(`FILTER:: ${filterText}`);
            //console.log(`iteration:: ${i}`);
            //if(childNode.name != null) console.log(`NAME:: ${childNode.name}`);
            //if(childNode.cardType != null)console.log(`CARDTYPE NUM:: ${childNode.cardType}`);
            //if(childNode.cardType != null) console.log(`CARDTYPE STR:: ${GetCardType(childNode.cardType)}`);
            //if(childNode.number != null) console.log(`NUMBER:: ${childNode.number}`);

            if (filterText != "" &&
                (
                    (childNode.name != null && !childNode.name.toLowerCase().includes(filterText))
                    || (childNode.cardType != null && childNode.cardType.toString().toLowerCase() != filterText)
                    || (childNode.cardType != null && GetCardType(childNode.cardType).toLowerCase() != filterText)
                    || (childNode.number != null && !childNode.number.toString().toLowerCase().includes(filterText))
                )) {
                //console.log(`Removing ${childNode.name}`);
                cardCollection.removeChild(cardCollection.childNodes[i]);
                removed = true;
            }
            //console.log("----")
            i++;
        }
    }
    //console.log("collection.categories length: " + collection.categories.length);
    for (var i = 0; i < collection.categories.length; i++) {
        //console.log(`collection.categories[${i}] length: ${collection.categories[i].cards.length}`);
        for (var j = 0; j < collection.categories[i].cards.length; j++) {
            var childNode = collection.categories[i].cards[j];
            //console.log(`FilterText :: ${filterText}`);
            if ((filterText == "" || (
                (childNode.name != null && childNode.name.toLowerCase().includes(filterText))
                || (childNode.cardType != null && childNode.cardType.toString().toLowerCase() == filterText)
                || (childNode.cardType != null && GetCardType(childNode.cardType).toLowerCase() == filterText)
                || (childNode.number != null && childNode.number.toString().toLowerCase().includes(filterText))
            )) && !cardCollection.contains(childNode)) {
                //console.log(`adding ${childNode.name}`);
                cardCollection.appendChild(childNode);
            }
        }
    }
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
        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        UpdateShownCard2(span, await JSON.parse(data));        // Or put the next step in a function and invoke it
    });
}

function UpdateShownCard2(span, json) {
    var desc = document.getElementById("CardDescription");
    var number = document.getElementById("CardNumber");
    var monsterTypes = document.getElementById("CardMonsterTypes");
    var cardType = document.getElementById("CardType");
    var cardName = document.getElementById("CardName");

    //console.log(json);

    desc.innerHTML = json["description"];
    number.innerHTML = json["cardNumber"];
    monsterTypes.innerHTML = json["subCategories"].replace("[\"", "").replace("\"]", "");
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
        /*navSpan.onclick = e => {
            if (e.target.type == "span") {
                //console.log(`${e.target.name} with ID ${e.target.id} clicked`);
                UpdateShownCard(e.target);
            } else {
                UpdateShownCard(e.target.parentElement);
            }
        };*/
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

function SaveDeck(name) {

}

LoadIndexFile(InitializeCardCollection);
