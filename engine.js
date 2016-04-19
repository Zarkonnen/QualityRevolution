"use strict";

/* Converts a list into a list of triplets of q, op, v. */
function triplets(l) {
	if (l.length % 3 !== 0) {
		throw "Number of elements is not a multiple of 3: " + l.join(", ");
	}
	var l2 = [];
	for (var i = 0; i < l.length; i += 3) {
		l2.push({"q": l[i], "op": l[i + 1], "v": l[i + 2]});
	}
	return l2;
}

function parseEvents(text) {
	var events = [];
	var currentEvent = null;
	text.split("\n").forEach(function (l) {
		if (l.startsWith("---")) {
			if (currentEvent !== null) {
				events.push(currentEvent);
			}
			currentEvent = {
				"conditions": [],
				"situation": [],
				"text": "",
				"options": []
			};
			triplets(l.substring(3).trim().split(" ")).forEach(function (t) {
				if (t.op === ".") {
					currentEvent.situation.push(t);
				} else {
					currentEvent.conditions.push(t);
				}
			});
		} else if (l.startsWith("->")) {
			currentEvent.options.push({
				"text": l.split("->")[1].trim(),
				"effects": triplets(l.split("->")[2].trim().split(" "))
			});
		} else {
			currentEvent.text += l + "\n";
		}
	});
	events.push(currentEvent);
	return events;
}

var events = null;
jQuery.ajax("events.txt").done(function(text) {
	events = parseEvents(text);
	console.log(JSON.stringify(events, null, 4));
});

var gameState = {
	"qualities": [{"start": 1}]
	"currentEvent": null
};

function pickNextEvent() {
	
}

function displayState() {
	
}

pickNextEvent();
displayState();