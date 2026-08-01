const { CaptureInterface } = require("./lib/pcap-ffxiv");

const ci = new CaptureInterface({
	region: "Global",
});

function demo_fish_packet(fish_message) {
	console.log(fish_message)

	var flags = fish_message.parsedIpcData.flags

	// for visuals, print the flags as a binary string
	var flagsBinary = flags.toString(2).padStart(32, "0");
	if (!flagsBinary.startsWith("000000000000000000000000")) {
		// I've never seen the upper flags used; let's check just in case
		console.log('upper flags detected!');
		console.log(flagsBinary);
	}
	console.log(flagsBinary.substring(24));
	// lowest bit to highest
	console.log('fish_can_mooch: ' + ((flags >> 0) & 1)); // some other fish can eat this fish
	console.log('new_fish: ' + ((flags >> 1) & 1)); // you've never caught this fish before
	console.log('in_fishguide: ' + ((flags >> 2) & 1)); // this fish exists somewhere in the fish guide
	console.log('new_record: ' + ((flags >> 3) & 1)); // new record set for <location> !!
	console.log('large: ' + ((flags >> 4) & 1)); // fish has [large] pop-up
	console.log('collectable: ' + ((flags >> 5) & 1)); // set if the collectable screen choice is "yes"
	console.log('??: ' + ((flags >> 6) & 1));
	console.log('permit_mooch1: ' + ((flags >> 7) & 1)); // set if fish is large OR if MSB is active
}

function demo_spearfish_packet(spearfish_message) {
	//console.log(spearfish_message)
	// every packet is signed with the gathering node ID from sheet GatheringPoint
	//console.log("gathering at node %s", spearfish_message.parsedIpcData.param1 % (1 << 16))

	if (spearfish_message.parsedIpcData.param2 == 0) { // plays when you or the game closes the window
		//console.log('closing window')
	} else if (spearfish_message.parsedIpcData.param2 == 1) { // every time a new fish shadow spawns
		// 0 = bottom lane, 1 = middle lane, 2 = top lane
		// % (1 << 2) = get the last two bits
		shadow_lane = spearfish_message.parsedIpcData.param3 % (1 << 2)
		lane_params = {
			'0': 'bottom',
			'1': 'middle',
			'2': 'top'
		}
		// speeds, slower to faster, 100 - 500 by 50
		shadow_speed = spearfish_message.parsedIpcData.param4
		speed_params = {
			'100': 'basically not moving',
			'150': 'extremely slow',
			'200': 'very slow',
			'250': 'slow',
			'300': 'average',
			'350': 'fast',
			'400': 'very fast',
			'450': 'extremely fast',
			'500': 'too fast too furious'
		}
		// sizes, corresponding to old gig head sizes
		// 1 = small, 2 = medium, 3 = large
		shadow_size = spearfish_message.parsedIpcData.param5
		size_params = {
			'1': 'small',
			'2': 'medium',
			'3': 'large'
		}
		// shiny lanes have values in their upper half
		if (spearfish_message.parsedIpcData.param3 > 3) {
			//console.log('Oooh shiny!!')
		}
		//console.log('lane_%s update: speed %s, size %s', lane_params[shadow_lane], speed_params[shadow_speed], size_params[shadow_size])
	} else if (spearfish_message.parsedIpcData.param2 == 2) { // the fish flee
		// it does not trigger if you close the node early (because the fish don't flee)
		//console.log('fish flee')
	} else if (spearfish_message.parsedIpcData.param2 == 3) { // this is a "caught fish" packet
		spearfish_id = spearfish_message.parsedIpcData.param3 // this ID is from the SpearfishingItem table
		spearfish_size = spearfish_message.parsedIpcData.param4
		spearfish_large = ((spearfish_message.parsedIpcData.param5 >> 1) & 1)
		//console.log('you caught a %s with size=%s...%s', spearfish_id, spearfish_size, spearfish_large ? "it's large" : "it's small")
	} else if (spearfish_message.parsedIpcData.param2 == 4) { // every time catch chain updates (good or bad)
		//console.log('CATCH CHAIN! -> %d', spearfish_message.parsedIpcData.param3)
	} else if (spearfish_message.parsedIpcData.param2 == 5) { // after most interactions
		// using baited breath displays a large positive number, 
		// possibly reflecting it decreasing the wariness HP
		current_wariness_rate = (spearfish_message.parsedIpcData.param3 / 90000) * 100
		//console.log('wariness mod %s%%', current_wariness_rate)
	} else if (spearfish_message.parsedIpcData.param2 == 6) { // the window opens
		// param3 has some unknown (or garbage) data in it, looks like a timestamp
		//console.log('opening window %s', spearfish_message.parsedIpcData.param3)
	} else if (spearfish_message.parsedIpcData.param2 == 7) { // caught first fish at node
		// this only plays on the first catch, not on any subsequent catches
		// even if you go from catch chain 1 -> catch chain 0 -> back to catch chain 1
		// no idea why
		//console.log('first catch')
	} else if (spearfish_message.parsedIpcData.param2 == 8) { // intuition
		// this is spearfish-intuition, NOT progress toward swimming shadows 'intuition'
		// intuition ID is from SpearfishingComboTarget table
		//console.log('intuition gained: %s', spearfish_message.parsedIpcData.param3)
	} else if (spearfish_message.parsedIpcData.param2 == 9) { // intuition fell off naturally
		console.log('intuition fell off: %s', spearfish_message.parsedIpcData.param3)
	} else if (spearfish_message.parsedIpcData.param2 == 10) { // intuition removed because of catch
		console.log('intuition consumed by catch')
	} else if (spearfish_message.parsedIpcData.param2 == 11) { // character used a skill
		// this field pulls from the Action table...
		// for clarity here are pre-loaded IDs
		skill_params = {
			'7632': 'gig',
			'26870': 'vital sight',
			'26871': 'baited breath',
			'26872': 'electric current',
			'7906': 'veteran trade'
		}
		//console.log('skill used: %s', skill_params[spearfish_message.parsedIpcData.param3])
	} else if (spearfish_message.parsedIpcData.param2 == 12) { // new record?
		// big: 27, small: 25
		//console.log('new record! (%s %s %s)', spearfish_message.parsedIpcData.param3, spearfish_message.parsedIpcData.param4, spearfish_message.parsedIpcData.param5)
	} else if (spearfish_message.parsedIpcData.param2 == 13) { // every time vital sight is used
		// param3/4/5 typically say 75, no idea why
		//console.log('vital sight used (%s %s %s)', spearfish_message.parsedIpcData.param3, spearfish_message.parsedIpcData.param4, spearfish_message.parsedIpcData.param5)
	} else if (spearfish_message.parsedIpcData.param2 == 14) { // intuition refreshed
		//console.log('intuition refresh %s', spearfish_message.parsedIpcData.param3)
	} else {
		console.log('unmapped spearfish_message type: %s; %s,%s,%s,%s', spearfish_message.parsedIpcData.param2, spearfish_message.parsedIpcData.param3, spearfish_message.parsedIpcData.param4, spearfish_message.parsedIpcData.param5, spearfish_message.parsedIpcData.param6)
	}
}



ci.on("message", (message) => {
	if (message.type == "fishCaught") {
		demo_fish_packet(message);
	} else if (message.type == 'actorControlSelf' && message.parsedIpcData.category == 109) {
		demo_spearfish_packet(message);
	} else {
		// console.log(message.type);
	}
}).on("error", (err) => {
	console.log("ERR EVENT", err);
});

ci.once("ready", () => {
	ci.start()
		.then(() => {
			console.log("Everything is started !");
		})
		.catch((err) => {
			console.log("Error starting pcap:", err);
		});
});
