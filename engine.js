"use strict";

/* Converts a list into a list of triplets of q, op, v. */
function triplets(l) {
	if (l.length > 0 && l.length % 3 !== 0 && !(l.length == 1 && l[0].length == 0)) {
		throw "Number of elements is not a multiple of 3: " + l.length + " " + l.join(", ");
	}
	var l2 = [];
	for (var i = 0; i < l.length; i += 3) {
		l2.push({"q": l[i], "op": l[i + 1], "v": parseInt(l[i + 2])});
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
				"effects": l.split("->").length > 2 ? triplets(l.split("->")[2].trim().split(" ")) : []
			});
		} else {
			currentEvent.text += l + "\n";
		}
	});
	events.push(currentEvent);
	return events;
}

function evalConditions(cs) {
	return cs.every(function(c) {
		var q = gameState.qualities[c.q] || 0;
		var v = c.v;
		switch (c.op) {
			case "=":
				return q === v;
			case ">":
				return q > v;
			case "<":
				return q < v;
			case ">=":
				return q >= v;
			case "<=":
				return q <= v;
		}
		throw "Unknown comparison: " + c.op;
	});
}

function pickNextEvent() {
	var candidates = events.filter(function(e) { return evalConditions(e.conditions); });
	var dCandidates = candidates.map(function(c) {
		var dist = c.situation.reduce(function(prev, s) {
			return prev + Math.pow(s.v - (gameState.qualities[s.q] || 0), 2);
		}, 1);
		return [dist, c];
	});
	if (dCandidates.length === 0) {
		throw "No candidates for " + JSON.stringify(gameState.qualities);
	}
	var leastDistance = dCandidates.reduce(function(prev, dc) {
		return Math.min(prev, dc[0]);
	}, 100000000000);
	var weightedCandidates = dCandidates.filter(function(dc) {
		return dc[0] < leastDistance * 4;
	}).map(function(dc) {
		return [1.0 / (dc[0]), dc[1]];
	});
	var totalWeight = weightedCandidates.reduce(function(prev, wc) {
		return prev + wc[0];
	}, 0);
	var roll = Math.random() * totalWeight;
	var eventIndex = 0;
	while (roll > weightedCandidates[eventIndex][0]) {
		roll -= weightedCandidates[eventIndex][0];
		eventIndex++;
	}
	gameState.currentEvent = weightedCandidates[eventIndex][1];
}

function pickOption(i) {
	var option = gameState.currentEvent.options[i];
	option.effects.forEach(function(e) {
		switch (e.op) {
			case "=":
				gameState.qualities[e.q] = e.v;
				return;
			case "+":
				gameState.qualities[e.q] = (gameState.qualities[e.q] || 0) + e.v;
				return;
			case "-":
				gameState.qualities[e.q] = (gameState.qualities[e.q] || 0) - e.v;
				return;
		}
		throw "Unknown operation: " + c.op;
	});
	pickNextEvent();
	displayState();
}

function format(text) {
	while (text.indexOf("((") !== -1) {
		var subStart = text.indexOf("((");
		var condEnd = text.indexOf(")", subStart);
		var subEnd = text.indexOf(")", condEnd + 1);
		var cond = text.substring(subStart + 2, condEnd);
		var result = text.substring(condEnd + 1, subEnd);
		if (evalConditions(triplets(cond.trim().split(" ")))) {
			text = text.substring(0, subStart) + result + text.substring(subEnd + 1);
		} else {
			text = text.substring(0, subStart) + text.substring(subEnd + 1);
		}
	}
	return text;
}

function displayState() {
	var text = format(gameState.currentEvent.text);
	for (var i = 0; i < gameState.currentEvent.options.length; i++) {
		text += "<div class=\"option\" onclick=\"pickOption(" + i + ")\">" +
			format(gameState.currentEvent.options[i].text) +
		"</div>";
	}
	
	jQuery("#content").html(text);
}

var events = null;
var gameState = null;
jQuery.ajax("events.txt").done(function(text) {
	events = parseEvents(text);
	gameState = {
		"qualities": {},
		"currentEvent": events[0]
	};
	events.splice(0, 1);
	displayState();
});