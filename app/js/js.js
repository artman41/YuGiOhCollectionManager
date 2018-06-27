const http = require("http");
const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');

var collection = {}; //all the possible cards sorted into [Monsters, Spells, Traps]
var IndexJson; //the global card index file
var deck = []; //the deck collection (right hand pane)
var extras = ["Xyz", "Fusion", "Synchro", "Pendulum"]; //types that are meant to be in the extra deck

var cardCollection = document.getElementById("CardCollection"); //the collection of cards in the center pane
var ft = document.getElementById("CardFilter"); //the filter, right-most textbox

//a function to turn strings from xyz -> Xyz
String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

//returns true if the target array contains any items of the param array
Array.prototype.contains = function (array2) {
    for (var i = 0; i < this.length; i++) {
        for (var j = 0; j < array2.length; j++) {
            if (this[i] == array2[j])
                return true;
        }
    }
    return false;
};

//closes the program, called by the HTML
function CloseWindow() {
    //console.log("Closing Windows");
    remote.getCurrentWindow().close();
}

//Loads the Card Index
function LoadIndexFile(action) { //action is the callback
    fs.readFile(`${__dirname}/../Cards/index.json`, async function read(err, data) { //reads the card index
        if (err) {
            throw err;
        }

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        // Or put the next step in a function and invoke it
        action(await JSON.parse(data)); //triggers the callback with the json as a param
    });
}

//loads any JsonFile
function LoadJsonFile(action, jsonLoc, p1, p2) {
    //if p2 is undefined, it'll load any json
    //else it'll attempt to load a card json
    var jsonLocation = p2 != undefined ? jsonLoc : `${__dirname}/../Cards/Json/${jsonLoc}.json`;
    //console.log(jsonLocation);
    fs.readFile(jsonLocation, async function read(err, data) {
        if (err) {
            throw err;
        }

        var json = await JSON.parse(data); //gets the json data
        if (p1 != undefined) //if there is a param, attempt to correct the subCategories array from a string to an actual array
            json["subCategories"] = JSON.parse(json["subCategories"]);

        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        if (p1 != undefined)
            action(json, p1);          // Or put the next step in a function and invoke it
        else
            action(json);
    });
}

//initializes the global collection object
function InitializeCardCollection(indexJson) {
    IndexJson = indexJson; //initializes the global cardIndex object
    collection.name = "CardIndex";
    var monsters = {};
    monsters.cards = [];
    var spells = {};
    spells.cards = [];
    var traps = {};
    traps.cards = [];
    collection.categories = [monsters, spells, traps];

    for (var i = 0; i < Object.keys(indexJson).length; i++) { //for each card in the index
        //----------------------------------------
        var span = document.createElement("span");
        span.classList.add("nav-group-item");
        span.id = `card-${Object.values(indexJson)[i]["cardNumber"]}`;
        span.value = Object.values(indexJson)[i];
        span.cardType = Object.values(indexJson)[i]["cardType"];
        span.name = Object.values(indexJson)[i]["name"];
        span.number = Object.values(indexJson)[i]["cardNumber"];
        //span.image = `${__dirname}/../Cards/Images/${Object.values(indexJson)[i]["cardNumber"]}.png`;
        span.type = "span";
        span.jsonLocation = `${__dirname}/../Cards/Json/${Object.values(indexJson)[i]["cardNumber"]}.json`;
        //----------------------------------------
        //| Creates a span containing all the
        //|  values of the card
        //----------------------------------------

        //----------------------------------------
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
        //----------------------------------------
        //| Creates the accompanying icon to be
        //|  displayed next to the card name
        //----------------------------------------

        //attaches the image to the span
        span.appendChild(image);

        //adds the name of the card to the span
        span.appendChild(document.createTextNode(Object.values(indexJson)[i]["name"]));

        span.onclick = e => {
            //if the span itself was clicked
            if (e.target.type == "span") {
                //pass the span as a param
                UpdateShownCard(e.target);
                //if the image was clicked
            } else {
                //pass the span (which is the parent) as a param
                UpdateShownCard(e.target.parentElement);
            }
        };

        span.ondblclick = e => {
            //if the span itself was clicked
            if (e.target.type == "span") {
                //loads the card json with the passcode contained by the span
                //uses the params <json, amount>
                LoadJsonFile(AddCard, e.target.number, 1);
                //if the image was clicked
            } else {
                LoadJsonFile(AddCard, e.target.parentElement.number, 1);
            }
            //}
        };
        //collection is [monster, spell, trap] to match the cardType values
        collection.categories[parseInt(Object.values(indexJson)[i]["cardType"]) - 1].cards.push(span);
    }
    //updates what can be seen by the user
    UpdateShownCollection();
    //updates the card shown on the right to be the top most card
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

//returns the card with the corresponding details
function GetCard(cardType, number) {
    return collection.categories[cardType - 1].cards.find(o => o.number == number);
}

//updates the spans contained in the center pane
//  - adds the spans on first run
//  - hides/unhides spans thereafter
function UpdateShownCollection(ev) {
    //if the object is null, attempt to get it again
    if (cardCollection == null) {
        cardCollection = document.getElementById("CardCollection");
    }
    //if the object is null, attempt to get it again
    if (ft == null) {
        ft = document.getElementById("CardFilter");
    }

    //gets the filter text to a lowercase string
    var filterText = ft.value.toString().toLowerCase();
    while (filterText.startsWith("0"))
        filterText = filterText.substring(1);
    //if the cardCollection exists
    if (cardCollection != null) {
        //weird bug where there's a text object in the collection, should only ever contain #span
        if (cardCollection.childNodes[0] != null && cardCollection.childNodes[0].nodeName == "#text") {
            cardCollection.removeChild(cardCollection.childNodes[0]);
        }

        //iterate through all the items in the collection
        for (var i = 0; i < cardCollection.childElementCount; i++) {
            //gets the span at index i
            var childNode = cardCollection.childNodes[i];

            if (childNode.style.display == "none")
                continue;

            var isInt = !isNaN(parseInt(filterText));

            if (filterText != "") {
                childNode.style.display = "none"; //hides the span
            }
        }
    }

    var loop = function (childNode) {
        if (filterText == "" || ( //if filter text is empty
            (!isInt && (
                    (childNode.name != null && childNode.name.toLowerCase().includes(filterText)) //Check name isn't null, the filter isn't pure numbers & doesn't include filter text
                    || (childNode.cardType != null && GetCardType(childNode.cardType).toLowerCase() == filterText) //Check cardType isn't null & the string version isn't equal to filter text
                )
                || (isInt && (childNode.number != null && childNode.number.toString().toLowerCase().includes(filterText))) //Check number isn't null & isn't equal to filter text
            )
        )
        ) {
            if (ev == undefined)//if the collection doesn't already contain the card add it
                cardCollection.appendChild(childNode); //add the card
            else if (childNode.style.display == "none") //else if the span is hidden
                childNode.style.display = "block"; //unhide the span
        }
    };

    //if we've called this method ourselves
    if (ev == undefined)
        for (var i = 0; i < collection.categories.length; i++)
            for (var j = 0; j < collection.categories[i].cards.length; j++)
                //calls the above method to generate all the span object initially
                loop(collection.categories[i].cards[j]);
    else
        for (var i = 0; i < cardCollection.childElementCount; i++)
            //calls the above method to hide/unhide all span objects
            loop(cardCollection.childNodes[i]);
}

//updates the card shown on the right
function UpdateShownCard(span) { //where span is an object created in <InitializeCardCollection>
    var image = document.getElementById("CardImage");
    var desc = document.getElementById("CardDescription");

    LoadJsonFile(json=>{
        image.src = json["image"];
    }, span.jsonLocation, undefined, true);

    var callback = function (span, json) {
        var desc = document.getElementById("CardDescription");
        var number = document.getElementById("CardNumber");
        var monsterTypes = document.getElementById("CardMonsterTypes");
        var cardType = document.getElementById("CardType");
        var cardName = document.getElementById("CardName");

        document.getElementById("CardImage").style.opacity = "1.0"; //image is initially at opacity 0 in html
        desc.innerHTML = json["description"];
        number.innerHTML = json["cardNumber"];
        monsterTypes.innerHTML = json["subCategories"].join(", ");
        cardType.innerHTML = GetCardType(json["cardType"]).toTitleCase(); //gets the string name of the card type, e.g 1 -> monster
        cardName.innerHTML = json["name"];
    };

    fs.readFile(span.jsonLocation, async function read(err, data) {
        if (err) {
            throw err;
        }

        var json = await JSON.parse(data); //gets the json data
        json["subCategories"] = JSON.parse(json["subCategories"]); //attempts to correct the subCategories var
        // Invoke the next step here however you like
        //console.log(data);   // Put all of the code here (not the best solution)
        // Or put the next step in a function and invoke it
        callback(span, json);
    });
}

//adds a card to the deck
function AddCard(json, amount) {
    //attempts to find the card within the deck
    var item = deck.find(o => o.number == json["cardNumber"]);
    //if the card can't be found
    if (item == null) {
        //----------------------------------------
        var obj = {};
        obj.number = json["cardNumber"];
        obj.amount = amount;
        obj.type = parseInt(json["cardType"]);
        obj.name = json["name"];
        obj.json = json;
        deck.push(obj);
        //----------------------------------------
        //| Creates a card object and pushes it
        //|  to the deck array
        //----------------------------------------
    } else {
        //if there's already 3 in the deck, don't add any
        if (item.amount >= 3) return;
        //else increment the value by the given amount
        item.amount += amount;
    }
    UpdateShownDeck();

}

//removes a card from the deck
function RemoveCard(json, amount) {
    //attempts to find the card in the deck
    var item = deck.find(o => o.number == json["cardNumber"]);
    //if the card is in the deck
    if (item != null) {
        //decrease the amount of cards in the deck by amount
        item.amount -= amount;
        //if the amount of cards <= 0 then remove it
        if (item.amount <= 0) {
            deck = deck.filter(o => o !== item);
        }
    }
    UpdateShownDeck();
}

//updates what can visually be seen in the deck (left pane)
function UpdateShownDeck() {
    if (deck.length > 0)
        deck = SortDeck();
    var holder = document.getElementById("DeckHolder");
    //removes all objects from the deck
    while (holder.childElementCount > 0) {
        holder.removeChild(holder.childNodes[0]);
    }

    //inits the deck size as 0
    var deckSize = 0;

    for (var i = 0; i < deck.length; i++) {
        deckSize += deck[i].amount;

        //----------------------------------------
        var div = document.createElement("div");
        div.style.paddingLeft = "0px";
        //----------------------------------------
        //| Creates a parent div to hold the span
        //----------------------------------------

        //----------------------------------------
        var navSpan = document.createElement("span");
        navSpan.classList.add("nav-group-item");
        navSpan.style.paddingLeft = "5px";
        navSpan.style.display = "inline-block";
        navSpan.object = deck[i];
        navSpan.type = "span";
        //----------------------------------------
        //| Creates a span to contain the card
        //|  inside the pane
        //----------------------------------------

        //----------------------------------------
        var span = document.createElement("span");
        span.style.cssFloat = "left";
        //----------------------------------------
        //| Creates the base span which will hold
        //|   all the DOM elements of the card
        //----------------------------------------

        //----------------------------------------
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
        //----------------------------------------
        //| Creates the accompanying icon to be
        //|  displayed next to the card name
        //----------------------------------------

        //----------------------------------------
        var p1 = document.createElement("p");
        p1.style.display = "inline";
        p1.innerText = `${deck[i].amount} x `;
        //----------------------------------------
        //| Creates a text object representing the
        //|  amount contained in the deck
        //----------------------------------------

        //----------------------------------------
        var p2 = document.createElement("p");
        p2.style.display = "inline";
        p2.innerText = `${deck[i].name}`;
        //----------------------------------------
        //| Creates a text object representing
        //|  the name of the card
        //----------------------------------------

        span.appendChild(img);
        span.appendChild(p1);
        span.appendChild(p2);

        navSpan.onclick = e => {
            //if the span was clicked
            if (e.target.type == "span") {
                //get the clicked span and pass the number (card passcode) to the <UpdateShownCard> function
                UpdateShownCard(collection.categories[e.currentTarget.object.type - 1].cards.find(o => o.number == e.currentTarget.object.number));
                //if the icon was clicked
            } else {
                //get the clicked span and pass the number (card passcode) to the <UpdateShownCard> function
                UpdateShownCard(collection.categories[e.currentTarget.object.type - 1].cards.find(o => o.number == e.currentTarget.object.number));
            }
        };

        navSpan.ondblclick = e => {
            //remove the card from the deck
            RemoveCard(e.currentTarget.object.json, 1);
        };

        div.appendChild(span);
        navSpan.appendChild(div);
        holder.appendChild(navSpan);
    }

    //updates the text displayed by the pane
    document.getElementById("DeckHeader").innerText = `Deck - ${deckSize}`
}

//sorts the deck by cardType and then by name
function SortDeck(d) {
    if (d == undefined)
        d = deck;
    var x = d.filter(o => o.type == 1);
    var y = d.filter(o => o.type == 2);
    var z = d.filter(o => o.type == 3);

    x.sort((a, b) => a.name.localeCompare(b.name));
    y.sort((a, b) => a.name.localeCompare(b.name));
    z.sort((a, b) => a.name.localeCompare(b.name));

    return (x.concat(y).concat(z));
}

//Saves the deck to a file
function SaveDeck() {
    var deckName = document.getElementById("DeckName").value;

    var extraDeck = SortDeck(deck.filter(o => o.json["subCategories"].contains(extras))); //gets the extra Deck cards
    var mainDeck = SortDeck(deck.filter(o => !extraDeck.includes(o))); //gets the main deck cards


    var deckString = "";
    deckString += "#Created By [Yu-Gi-Oh Deck Builder]\n";

    //----------------------------------------
    deckString += "#main\n";
    for (var i = 0; i < mainDeck.length; i++) {
        var item = mainDeck[i];
        for (var j = 0; j < item.amount; j++) {
            deckString += `${item.json.cardNumber}\n`;
        }
    }
    //----------------------------------------
    //| iterates through all the mainDeck cards
    //| and adds them to the string
    //----------------------------------------

    //----------------------------------------
    deckString += "#extra\n";
    for (var i = 0; i < extraDeck.length; i++) {
        var item = extraDeck[i];
        for (var j = 0; j < item.amount; j++) {
            deckString += `${item.json.cardNumber}\n`
        }
    }
    //----------------------------------------
    //| iterates through all the extraDeck cards
    //| and adds them to the string
    //----------------------------------------

    deckString += "!side\n"; //haven't implemented side deck

    //allows for saving of the deckstring to a file
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

//Loads the deck from a file
function LoadDeck() {
    //empties the deck
    if (deck.length > 0) {
        var replaceDeck = dialog.showMessageBox({
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Deck will be overridden.\nAre you sure you want to load a deck?'
        }) === 0;
        if (!replaceDeck)
            return;
        deck = [];
        //clears the deck pane
        UpdateShownDeck();
    }

    //prompts the user to open a deck file
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

                //gets all the passcodes as an array
                var numbers = data.split("\n").filter(o => !o.startsWith("#") && !o.startsWith("!") && o != "");

                for (var i = 0; i < numbers.length; i++) {

                    //gets the indexed card json from IndexJson
                    var jsonI = IndexJson.find(o => parseInt(o.cardNumber) == parseInt(numbers[i]));

                    //gets the card from the collection
                    var tempCard = collection.categories[jsonI.cardType - 1].cards.find(o => parseInt(o.number) == parseInt(numbers[i]));

                    //adds the card to the deck
                    LoadJsonFile(AddCard, tempCard.jsonLocation, 1, true);
                }

                //updates the deck pane to display all cards
                UpdateShownDeck();
            });
        });
}

LoadIndexFile(InitializeCardCollection); //loads the card index triggering <InitializeCardCollection> as a callback
