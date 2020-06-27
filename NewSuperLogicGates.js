"use strict";

var blog = false;
console.blog = function(...args) {
    if (blog) {
        console.log(...args);
    }
}
console.bgroup = function(...args) {
	if (blog) {
		console.group(...args);
	}
}
console.bgroupEnd = function(...args) {
	if (blog) {
		console.groupEnd(...args);
	}
}

Object.defineProperty(Math, "TAU", {
	value: Math.PI * 2,
	writable: false,
	configurable: false
});

const zeroes = function(num) {
	var arr = [];
	for (var i = 0; i < num; i++) {
		arr.push(0);
	}
	return arr;
}

// EventDispatcher scope
{
	// Prototype object for EventDispatcher instances
	const EventDispatcherProto = Object.create(null);
	
	/**
	 * Creates an EventDispatcher object
	 * Handles dispatching events and calling registered callbacks
	 *
	 * @param eventNames		Array of event names to define
	 */
	var EventDispatcher = function(eventNames) {
		// Create object
		const EventDispatcher = Object.create(EventDispatcherProto);
		
		// Internal object state
		const callbacks = Object.create(null);
		
		// Public methods
		/**
		 * Define events given an array of event names
		 *
		 * @param eventNames	Array of event names to define
		 */
		EventDispatcher.defineEvents = function(eventNames) {
			// Add event name arrays to callback object
			eventNames.forEach(function(eventName) {
				if (!callbacks[eventName]) {
					callbacks[eventName] = [];
				}
			});	
		}
		EventDispatcher.defineEvents(eventNames);
		
		/**
		 * Dispatch an event to the registered callbacks
		 *
		 * @param gEvent		The gate event to dispatch
		 */
		EventDispatcher.dispatchEvent = function(gEvent) {
			const eventName = gEvent.type;
			
			// Input validation
			if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
			
			// Call all callbacks for the given event with the given event data
			callbacks[eventName].forEach(function(callback) {
				callback(gEvent);
			});
		}
		
		/**
		 * Add an event listener callback for a given event
		 *
		 * @param eventName		The name of the event to listen for
		 * @param callback		The callback
		 */
		EventDispatcher.addEventListener = function(eventName, callback) {
			// Input validation
			if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
			if (!callback) throw new Error("A callback function must be provided");
			
			// Add callback
			callbacks[eventName].push(callback);
		}
		
		/**
		 * Remove a given event listener callback for a given event
		 *
		 * @param eventName		The name of the event
		 * @param callback		The callback to remove
		 */
		EventDispatcher.removeEventListener = function(eventName, callback) {
			// Input validation
			if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
			if (!callback) throw new Error("A callback function must be provided");
			let callbackIndex = callbacks[eventName].indexOf(callback);
			//if (callbackIndex === -1) throw new Error("The given callback is not registered with the event \"" + eventName + "\"");
			
			// Remove callback
			if (callbackIndex !== -1) {
				callbacks[eventName].splice(callbackIndex, 1);
			}
		}
		
		EventDispatcher.getEventListeners = function(eventName) {
			return callbacks[eventName];
		}
		
		// Freeze and return object
		return Object.freeze(EventDispatcher);
	}
	
	// Bind prototype to constructor
	EventDispatcher.prototype = EventDispatcherProto;
	
	// Bind constructor to prototype
	EventDispatcherProto.constructor = EventDispatcher;
	
	// Freeze prototype
	Object.freeze(EventDispatcherProto);
}

// GEvent scope
{
	// Prototype object for GEvent instances
	const GEventProto = Object.create(null);

	/**
	 * Creates a GEvent object
	 * Stands for Gate Event
	 * Holds information about the event, including a type property whose value is the event's name
	 *
	 * @param eventName			The name of the event
	 * @param eventProperties	Additional properties to by added to the gEvent object
	 */
	var GEvent = function(eventName, eventProperties) {
		// Create object
		const gEvent = Object.create(GEventProto);
		
		// Public properties
		gEvent.type = eventName;
		Object.assign(gEvent, eventProperties);
		
		// Freeze and return event
		return Object.freeze(gEvent);
	}
	
	// Bind prototype to constructor
	GEvent.prototype = GEventProto;
	
	// Bind constructor to prototype
	GEventProto.constructor = GEvent;
	
	// Freeze prototype
	Object.freeze(GEvent);
}

// Connection scope
{
	// Prototype object for Connection instances
	const ConnectionProto = Object.create(null);
	
	/**
	 * Severs a connection
	 * Calls removeInput(this.inputIndex) on the inputTo gate
	 *
	 * @return	True or false, depending on whether the connection was succesfully severed
	 */
	ConnectionProto.sever = function() {
		return this.inputTo.removeInput(this.inputIndex);
	}
	
	/**
	 * Creates a Connection object
	 * Holds information about connected gates
	 *
	 * @param outputFrom	The gate from which an output is being taken
	 * @param outputIndex	The index of the output
	 * @param inputTo		The gate to which the input is being provided
	 * @param inputIndex	The index of the input
	 *
	 * @returns				An input object
	 */
	var Connection = function(outputFrom, outputIndex, inputTo, inputIndex) {
		// Input validation
		if (outputIndex >= outputFrom.numOutputs) throw new Error("The output index must not be greater than or equal to the number of outputs the given gate has");
		if (inputIndex >= inputTo.numInputs) throw new Error("The input index must not be greater than or equal to the number of inputs the given gate has");
		const inputSize = inputTo.getInputSize(inputIndex);
		const outputSize = outputFrom.getOutputSize(outputIndex);
		if (inputSize !== outputSize && inputSize !== Infinity && outputSize !== Infinity) throw new Error("Input size must match output size");
		
		// Create object
		const connection = Object.create(ConnectionProto);
		
		// Public properties
		connection.outputFrom = outputFrom;
		connection.outputIndex = outputIndex;
		connection.inputTo = inputTo;
		connection.inputIndex = inputIndex;
		
		// Freeze and return object
		return Object.freeze(connection);
	}
	
	// Bind prototype to constructor
	Connection.prototype = ConnectionProto;
	
	// Bind constructor to prototype
	ConnectionProto.constructor = Connection;
	
	// Freeze protoype
	Object.freeze(ConnectionProto);
}

/**
 * Calls itself recursively on the outputs of the given gate, executing a callback function
 * Records the depth of recursion and keeps track of which gates have been visited with a history Map
 *
 * @param gate			The gate the function is currently tracing
 * @param callback		The callback function. It is supplied the gate, depth, and history, in that order
 * @param depth			The depth of recursion. If it is not supplied, it is set to 0
 * @param history		The recursion history. If it is not supplied, it is initialized with only the current gate
 */
const traceOutputs = function(gate, callback, depth, history) {
	// If a history has not yet been provided, create one. Add the current gate to it
	if (!history) {
		history = new Map([[gate, true]]);
	} else {
		history.set(gate, true);
	}
	
	// If a depth has not been provided, set it to 0
	if (!depth) {
		depth = 0;
	}
	
	// Run callback function, providing the current gate, the recursion depth, and the recursion history
	callback(gate, depth, history);
	
	// Loop through the current gate's output gates, and call traceOutputs on them
	let reused = false;
	for (let outputTo of gate.getOutputMap().keys()) {
		if (!history.has(outputTo)) {
			if (reused) {
				traceOutputs(outputTo, callback, depth + 1, new Map(history));
			} else {
				traceOutputs(outputTo, callback, depth + 1, history);
				reused = true;
			}
		}
	}
}

// Gate scope
{
	// Prototype object for gate instances
	const GateProto = Object.create(null);
	
	/**
	 * Passes a calculator function to the prototype of the object
	 * Assumes that the prototype of the object is an instance of Gate
	 *
	 * @param calculator	Calculator function which takes an array of inputs and populates an array of outputs
	 */
	GateProto.setCalculator = function(calculator) {
		Object.defineProperty(this, "calculate", {
			enumerable: true,
			configurable: false,
			writable: false,
			value() {
				return Object.getPrototypeOf(this).calculate(calculator);
			}
		});
	}
	
	/**
	 * Passes an argumentProvider function to the prototype of the object
	 * Assumes that the prototype of the object is an instance of Gate
	 *
	 * @param argumentProvider			ArgumentProvider function which provides the arguments necessary to create a copy of an gate from its constructor
	 * @param argumentObjProvider		ArgumentObjProvider function provides the objects representations of the arguments necessary to create a clone of a gate from its constructor
	 */
	GateProto.setArgumentProvider = function(argumentProvider, argumentObjProvider) {
		if (!argumentObjProvider) {
			argumentObjProvider = argumentProvider;
		}
		
		Object.defineProperty(this, "getCopy", {
			enumerable: true,
			configurable: false,
			writable: false,
			value() {
				return Object.getPrototypeOf(this).getCopy(argumentProvider);
			}
		});
		Object.defineProperty(this, "toObj", {
			enumerable: true,
			configurable: false,
			writable: false,
			value() {
				return Object.getPrototypeOf(this).toObj(argumentObjProvider);
			}
		});
	}
	
	let instances = 0;
	
	/**
	 * Creates a gate object
	 * Represents an object which takes a certain number of inputs, processes them in some way, and produces a certain number of outputs
	 * The data processed be a gate can be any number, positive or negative
	 * Gates can be connected together to feed their outputs into the inputs of others
	 *
	 * @param inputSizes	An array of numbers. Each number represents the amount of data that input will receive, i.e. the input's size.
	 * @param outputSizes	An array of numbers. Each number represents the amount of data that output will produce, i.e. the output's size.
	 *
	 * @return				A gate object
	 */
	var Gate = function(inputSizes, outputSizes, constructor, state) {
		// Input validation
		inputSizes.forEach(function(inputSize){
			if (inputSize <= 0) throw new Error("An input's size cannot be less than or equal to 0");
		});
		outputSizes.forEach(function(outputSize) {
			if (outputSize <= 0) throw new Error("An output's size cannot be less than or equal to 0");
		});
		
		// Create object
		const gate = Object.create(GateProto);
		Object.assign(gate, EventDispatcher(["inputset", "outputset", "inputremoved", "outputremoved", "calculation"]));
		
		// Internal object state
		const numInputs = inputSizes.length; // Number of inputs
		const numOutputs = outputSizes.length; // Number of outputs
		const inputsFrom = []; // Array of Connection objects representing where the gate's inputs come from
		const outputsTo = []; // Array of Arrays of Connection objects representing where the gate's outputs come from
		const outputMap = new Map();
		const inputs = state ? state.inputs : []; // Array of input data
		let outputs = state ? state.outputs : []; // Array of output data
		let previousOutputs = []; // Array of previously calculated output data
		let structureMap;
		let updateRequired = true;
		
		// Load initial data into input and output arrays
		if (!state) {
			inputSizes.forEach(function(inputSize, i) {
				if (inputSize === Infinity) {
					inputs[i] = [];
				} else {
					inputs[i] = zeroes(inputSize);
				}
			});
			outputSizes.forEach(function(outputSize, i) {
				//outputs[i] = zeroes(outputSize);
				outputs[i] = [];
				//previousOutputs[i] = zeroes(outputSize);
				previousOutputs[i] = [];
			});
		}
		
		// Public properties
		gate.uid = instances++;
		gate.numInputs = numInputs;
		gate.numOutputs = numOutputs;
		Object.defineProperty(gate, "constructor", {
			enumerable: true,
			value: constructor || Gate
		});
		
		// Public methods
		/**
		 * Notifies the gate that an update will be required
		 * The update isn't actually performed until one if its methods that requires the structure to be up to date is called
		 */
		gate.flagUpdate = function() {
			updateRequired = true;
		}
		
		/**
		 * Updates the structure's layer map and gate array
		 * Also adds event listeners to all gates contained within the structure to flag it for an update if their inputs change
		 */
		gate.update = function(required) {
			// If no required flag was provided or the flag is true, perform the update
			if (required || required === undefined) {
				const that = this;
				
				// Store the previous layer map and gate array
				const previousLayerMap = structureMap ? structureMap.layerMap : new Map();
				const previousGateArray = structureMap ? structureMap.gateArray : [];
				
				// Update the structure map and set the updateRequired flag to false
				structureMap = Gate.generateStructureMap([this]);
				updateRequired = false;
				
				// Add flagUpdate as an event listener to all new gates added to the structure
				structureMap.gateArray.forEach(function(gate) {
					if (!previousLayerMap.has(gate)) {
						gate.addEventListener("inputset", that.flagUpdate);
						gate.addEventListener("inputremoved", that.flagUpdate);
					}
				});
				
				// Remove flagUpdate as an event listener to all gates removed from the structure
				previousGateArray.forEach(function(gate) {
					if (!structureMap.layerMap.has(gate)) {
						gate.removeEventListener("inputset", that.flagUpdate);
						gate.removeEventListener("inputremoved", that.flagUpdate);
					}
				});
			}
		}
		
		/**
		 * Gets the size of an input
		 * 
		 * @param inputIndex	The index of the input whose size will be returned
		 *
		 * @return				The input's size
		 */
		gate.getInputSize = function(inputIndex) {
			return inputSizes[inputIndex];
		}
		
		/**
		 * Gets the size of an output
		 *
		 * @param outputIndex	The index of the output whose size will be returned
		 *
		 * @return				The output's size
		 */
		gate.getOutputSize = function(outputIndex) {
			return outputSizes[outputIndex];
		}
		
		/**
		 * Sets an input
		 *
		 * @param outputFrom	The gate the input connects to
		 * @param outputIndex	The index of the output of the gate that the input should connect to
		 * @param inputIndex	The index of the input
		 */
		gate.setInput = function(outputFrom, outputIndex, inputIndex) {
			// If the input has already been set, remove it first
			if (inputsFrom[inputIndex]) {
				this.removeInput(inputIndex);
			}
			
			// Create connection object and set it as an input
			const connection = Connection(outputFrom, outputIndex, this, inputIndex);
			inputsFrom[inputIndex] = connection;
			
			// Automatically sets the connection as an output
			outputFrom.setOutput(connection);
			
			// Create and dispatch event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("inputset", e));
		}
		
		/**
		 * Sets an output
		 * Adds a connection to the outputsTo[connection.outputIndex] array, creating it if it does not yet exist
		 *
		 * @param connection	The Connection object holding the infromation about where to set the output
		 */
		gate.setOutput = function(connection) {
			// Create connection array if necessary
			if (!outputsTo[connection.outputIndex]) {
				outputsTo[connection.outputIndex] = [];
			}
			
			// Add gate to outputMap if necessary
			if (!outputMap.has(connection.inputTo)) {
				outputMap.set(connection.inputTo, []);
			}
			
			// Add connection to connection array
			outputsTo[connection.outputIndex].push(connection);
			
			// Add connection to outputMap
			outputMap.get(connection.inputTo).push(connection);
			
			// Create and dispatch event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("outputset", e));
		}
		
		/**
		 * Removes an input
		 * Also automatically removes the corresponding output from the outputFrom gate
		 * The input is succesfully removed if the input exists, and if the corresponding output is succesfully removed
		 *
		 * @param inputIndex	The index of the input to remove
		 *
		 * @return				True or false, depending on whether the input was succesfully removed
		 */
		gate.removeInput = function(inputIndex) {
			const connection = inputsFrom[inputIndex];
			if (!connection) return false;
			
			inputsFrom[inputIndex] = undefined;
			
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("inputremoved", e));
			
			return connection.outputFrom.removeOutput(connection);
		}
		
		/**
		 * Removes an output
		 * The output is succesfully removed if it is found
		 *
		 * @param connection	The Connection object holding the information about from where to remove the output
		 * 
		 * @return				True or false, depending on whether the output was succesfully removed
		 */
		gate.removeOutput = function(connection) {
			// Make sure the connection exists inside of the outputsTo object
			const connectionIndex = outputsTo[connection.outputIndex].indexOf(connection);
			if (connectionIndex === -1) return false;
			
			// Make sure the outputMap has the gate the output is connecting to
			const outputMapEntry = outputMap.get(connection.inputTo);
			if (!outputMapEntry) return false;
			
			// Make sure the outputMap has the connection
			const connectionMapIndex = outputMapEntry.indexOf(connection);
			if (connectionMapIndex === -1) return false;
			
			// Remove the connection from outputsTo
			outputsTo[connection.outputIndex].splice(connectionIndex, 1);
			
			// Remove the connection from outputMap
			outputMapEntry.splice(connectionMapIndex, 1);
			
			// If the gate has no more connections into it, remove it from the output map
			if (outputMapEntry.length === 0) {
				outputMap.delete(connection.inputTo);
			}
			
			// Create and dispatch outputremoved event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("outputremoved", e));
			
			// The removal was succesful!
			return true;
		}
		
		/**
		 * Returns the gate's output map
		 *
		 * @return	The gate's output map
		 */
		gate.getOutputMap = function() {
			return outputMap;
		}
		
		/**
		 * Loads the input data from the inputsFrom array into the inputs array
		 */
		gate.loadInputs = function() {
			inputSizes.forEach(function(inputSize, i) {
				// If a connection exists, set the input to a copy of the output data from the gate it points to. Otherwise, set the input to an array of zeroes
				const connection = inputsFrom[i];
				inputs[i] = connection ? connection.outputFrom.getOutput(connection.outputIndex).slice() : zeroes(inputSize);
			});
		}
		
		/**
		 * Loads the input data from the inputsFrom array for a particular input
		 *
		 * @param connection	Connection to load input from
		 */
		gate.loadInput = function(connection) {
			inputs[connection.inputIndex] = connection.outputFrom.getOutput(connection.outputIndex).slice();
		}
		
		/**
		 * Retreives output data from a specific output index
		 */
		gate.getOutput = function(outputIndex) {
			return outputs[outputIndex];
		}
		
		/**
		 * Calculates the gate's output data from its input data given a calculator function
		 *
		 * @param calculator	The calculator function
		 *
		 * @return				An array of gates connected to outputs that changed. 
		 *						Also contains a connectionMap property which maps the gates to an array of connections connected to which outputs changed
		 */
		gate.calculate = function(calculator) {
			// Cache current outputs in the previous outputs array
			previousOutputs = outputs;
			
			// Create calculation data object
			const data = Object.create(null);
			data.inputs = inputs;
			data.inputSizes = inputSizes;
			data.outputs = outputs;
			data.outputSizes = outputSizes;
			
			// Compute outputs
			outputs = calculator(Object.freeze(data));
			
			const result = []; // Array of gates connected to outputs that changed
			result.connectionMap = new Map(); // Map of gates connected to outputs that have changed to the connections pointing to them
			
			// Add output connections that changed
			outputs.forEach(function(outputData, i) {
				outputData.some(function(datum, j) {
					if (datum !== previousOutputs[i][j]) {
						const connections = outputsTo[i]
						if (connections) {
							connections.forEach(function(connection) {
								if (result.connectionMap.has(connection.inputTo)) {
									result.connectionMap.get(connection.inputTo).push(connection);
								} else {
									result.push(connection.inputTo);
									result.connectionMap.set(connection.inputTo, [connection]);
								}
							});
						}
						return true;
					}
				});
			});
			
			// Create and dispatch calculation event
			const e = Object.create(null);
			e.parent = this;
			e.inputs = inputs;
			e.outputs = outputs;
			e.result = result;
			this.dispatchEvent(GEvent("calculation", e));
			
			// Freeze and return the result object
			return result;
		}
		
		gate.propagate = function() {
			this.update(updateRequired);
			Gate.propagate([this], structureMap);
		}
		
		gate.getCopy = function(argumentProvider) {
			return constructor(...argumentProvider());
		}
		
		gate.toObj = function(argumentProvider) {
			const obj = Object.create(null);
			obj.name = GateRegistry.lookupConstructor(constructor);
			obj.arguments = argumentProvider();
			obj.uid = this.uid;
			obj.inputs = inputs;
			obj.outputs = outputs;
			obj.inputsFrom = [];
			inputsFrom.forEach(function(connection, i) {
				const inputFrom = Object.create(null);
				inputFrom.outputFrom = connection.outputFrom.uid;
				inputFrom.outputIndex = connection.outputIndex;
				inputFrom.inputIndex = i;
				obj.inputsFrom.push(inputFrom);
			});
			
			return Object.freeze(obj);
		}
		
		// Freeze and return object
		return Object.freeze(gate);
	}
	
	/**
	 * Combines an array of connection maps, mutating the first one and discarding the rest
	 * If two maps contain the same gate but different connections, the final combined map will contain that gate and the union of the two sets of connections
	 * There can be no duplicate connections because a gate can only have a single connection per input
	 *
	 * @param maps		An array of maps to combine into one
	 *
	 * @return			The first map in the array, with all the other maps combined into it
	 */
	const combineMaps = function(maps) {
		const combinedMap = maps[0];
		
		maps.forEach(function(map, i) {
			if (i === 0 || map.size === 0) {
				return;
			}
			
			map.forEach(function(connections, gate) {
				if (combinedMap.has(gate)) {
					const arr = combinedMap.get(gate);
					connections.forEach(function(connection) {
						arr.push(connection);
					});
				} else {
					combinedMap.set(gate, connections);
				}
			});
		});
		
		return combinedMap;
	}
	
	/**
	 * Updates a WeakMap which contains every gate the structure holds as a key and the layer it is on as its value
	 * The layer a gate is on is equal to how many connections away from a source it is on its longest path. Loops are ignored
	 *
	 * @return	A WeakMap whose keys are the structure's gates and whose values are those gates' layer
	 */
	Gate.generateStructureMap = function(sources) {
		console.bgroup("Generating structure map");
		
		// Create object
		const structureMap = Object.create(null);
		structureMap.layerMap = new WeakMap();
		structureMap.gateArray = [];
		structureMap.indexMap = new WeakMap();
		
		// Call traceOutputs on each source gate
		sources.forEach(function(source) {
			traceOutputs(source, function(gate, layer) {
				// If the current gate's layer has not yet been set or is lower than the current layer, set it to the current layer
				const recordedLayer = structureMap.layerMap.get(gate);
				if (!recordedLayer) {
					structureMap.gateArray.push(gate);
				}
				if (!recordedLayer || recordedLayer < layer) {
					structureMap.layerMap.set(gate, layer);
				}
			});
		});
		
		/**
		 * Function to compare gates based on their layer
		 * Returns the difference between the second given gate's layer and the first given gate's layer
		 *
		 * @param firstGate		The first gate
		 * @param secondGate	The second gate
		 *
		 * @return				The difference between their layers
		 */
		const compareGateLayer = function(firstGate, secondGate) {
			return structureMap.layerMap.get(secondGate) - structureMap.layerMap.get(firstGate);
		}
		
		console.blog("Sorting gate array");
		structureMap.gateArray.sort(compareGateLayer);
		console.blog("Gate array:", structureMap.gateArray);
		
		console.blog("Constructing index map");
		structureMap.gateArray.forEach(function(gate, i) {
			structureMap.indexMap.set(gate, i);
		});
		console.blog("Index map:", structureMap.indexMap);
		
		console.bgroupEnd();
		return Object.freeze(structureMap);
	}
	
	Gate.propagate = function(sources, structureMap) {
		let maps = []; // Temporary array to store the resulting connection maps from calculating the source gates
		let sortedGates = []; // An array of gates sorted by layer, from highest to smallest
		let visited = new WeakMap(); // A weak map of visited gates
		
		console.bgroup("Propagation started");
		console.bgroup("Calculating sources");
		
		// Add the result of calculating the source gates to sortedGates and maps
		sources.forEach(function(source) {
			let result = source.calculate();
			console.blog("Calculate ", source, result);
			maps.push(result.connectionMap);
		});
		
		// Combine connection maps and add output gates to sortedGates array
		let connectionMap = combineMaps(maps);
		for (let gate of connectionMap.keys()) {
			sortedGates[structureMap.indexMap.get(gate)] = gate;
		}
		
		console.blog("Connection map ", connectionMap);
		console.blog("Sorted gates ", sortedGates);
		console.bgroupEnd();
		console.bgroup("Calculating affected gates");
		
		// Evaluate each of the sorted gates, starting at the lowest layer, and add the results of their calculations to sortedGates and connectionMap
		let length = -1; // Number of elements iterable with forEach in sortedGates
		while (length !== 0) {
			length = 0;
			sortedGates.forEach(function(gate, i) {
				length++;
				//let gate = sortedGates.pop(); // Get gate at the lowest layer
				delete sortedGates[i]
				console.bgroup("Gate ", gate);
				
				console.bgroup("Loading inputs");
				// Loop through all connections connecting to it
				connectionMap.get(gate).forEach(function(connection) {
					// Load the inputs represented by those connections
					console.blog("Input ", connection.inputIndex, gate);
					gate.loadInput(connection);
				});
				console.bgroupEnd();
				
				// If the gate has not yet been visited, call its calculate function and add the results to sortedGates and connectionMap
				if (!visited.has(gate)) {
					let result = gate.calculate(); // Store result of the calculation
					console.blog("Calculate ", gate, result);
					
					// Add all affected gates to sortedGates
					result.forEach(function(outputTo) {
						sortedGates[structureMap.indexMap.get(outputTo)] = outputTo;
					});
					
					// Combine current connection map and the connection map from the result
					connectionMap = combineMaps([connectionMap, result.connectionMap]);
					
					// Keep track of which gates have been visited to prevent recursion
					visited.set(gate, true);
					
					console.blog("Connection map ", connectionMap);
					console.blog("Sorted gates ", sortedGates);
				} else {
					console.blog("Already visited ", gate);
				}
				
				console.bgroupEnd();
			});
			console.blog("Sorted gates length ", length);
		}
		console.bgroupEnd();
		console.bgroupEnd();
	}
	
	/**
	 * Creates an object representation of an array of gates
	 *
	 * @return		An arry of objects representing the gates
	 */
	Gate.gatesToObj = function(gateArray) {
		const obj = [];
		gateArray.forEach(function(gate) {
			obj.push(gate.toObj());
		});
		
		return Object.freeze(obj);
	}
	
	/**
	 * Creates an array of gates given their object representation
	 *
	 * @return		The arry of gates
	 */
	Gate.gatesFromObj = function(obj) {
		const gateArray = [];
		const idMap = Object.create(null);
		obj.forEach(function(gateObj) {
			const constructor = GateRegistry.lookupName(gateObj.name);
			const gate = Gate.fromObj(gateObj);
			gateArray.push(gate);
			idMap[gateObj.uid] = gate;
		});
		obj.forEach(function(gateObj) {
			const gate = idMap[gateObj.uid];
			gateObj.inputsFrom.forEach(function(inputFrom) {
				gate.setInput(idMap[inputFrom.outputFrom], inputFrom.outputIndex, inputFrom.inputIndex);
			});
		});
		
		gateArray.idMap = idMap;
		return gateArray;
	}
	
	/**
	 * Creates a gate given its object representation
	 *
	 * @param		The object representation
	 *
	 * @return		The gate
	 */
	Gate.fromObj = function(obj) {
		const constructor = GateRegistry.lookupName(obj.name);
		
		if (constructor.fromObj) {
			return constructor.fromObj(obj);
		} else {		
			const state = Object.create(null);
			state.inputs = obj.inputs;
			state.outputs = obj.outputs;
			
			return constructor(...obj.arguments, state);
		}
	}
	
	// Bind prototype to constructor
	Gate.prototype = GateProto;
	
	// Bind constructor to prototype
	GateProto.constructor = Gate;
	
	// Freeze prototype
	Object.freeze(GateProto);
}

// GateRegistry scope
{
	// Objects to keep track of gate constructors and their names
	const nameMap = Object.create(null);
	const constructorMap = new WeakMap();
	
	// Interface for maps
	var GateRegistry = Object.create(null);
	
	/**
	 * Add a constructor and name pair
	 */
	GateRegistry.add = function(constructor, name) {
		nameMap[name] = constructor;
		constructorMap.set(constructor, name);
	}
	
	/**
	 * Return the constructor associated with the given name
	 *
	 * @return	The constructor
	 */
	GateRegistry.lookupName = function(name) {
		return nameMap[name];
	}
	
	/**
	 * Return the name associated with the given constructor
	 *
	 * @return	The name
	 */
	GateRegistry.lookupConstructor = function(constructor) {
		return constructorMap.get(constructor);
	}
}

// Source scope
{
	/**
	 * Creates a Source object
	 * A gate that serves as a source of data
	 * Its data can be set externally
	 *
	 * @param	The size of the source
	 */
	var Source = function(size, state) {
		size = size || Infinity;
		
		// Create object
		const source = Object.create(Gate([], [size], Source, state));
		
		// Internal object state
		let data = size === Infinity ? [] : zeroes(size); // The source's data
		
		// Set the calculator function, which outputs the source's data
		source.setCalculator(function() {
			return [data];
		});
		
		// Set the argumentProvider function, which returns the source's arguments
		source.setArgumentProvider(function() {
			return [size];
		});
		
		// Public properties
		source.size = size;
		
		// Public methods		
		/**
		 * Sets the source's data and calls its calculate function
		 */
		source.setData = function(newData) {
			data = newData;
		}
		
		// Freeze and return object
		return Object.freeze(source);
	}
	
	GateRegistry.add(Source, "Source");
}

// Sink scope
{
	/**
	 * Creates a Sink object
	 * A gate that serves as a sink for data
	 * Its data can accessed externally
	 *
	 * @param	The size of the sink
	 */
	var Sink = function(size, state) {
		size = size || Infinity;
		
		// Create object
		const sink = Object.create(Gate([size], [], Sink, state));
		
		// Internal object state
		let data;
		
		// Set the calculator function, which sets the sink's data
		sink.setCalculator(function(newData) {
			data = newData.inputs[0];
			return [];
		});
		
		// Set the argumentProvider function, which returns the sink's arguments
		sink.setArgumentProvider(function() {
			return [size];
		});
		
		// Public properties
		sink.size = size;
		
		// Public methods		
		/**
		 * Gets the sink's data
		 */
		sink.getData = function() {
			return data;
		}
		
		return Object.freeze(sink);
	}
	
	GateRegistry.add(Sink, "Sink");
}

// Structure scope
{
	// Prototype object for Structure instances
	const StructureProto = Object.create(null);
	
	/**
	 * Returns the index of an element in the given array equal to the given element using a binary search algorithm
	 * If no element in the array is equal to the given element, the function will return the index of the smallest larger element
	 * Comparisons are made using a provided comparison function
	 * The array must be sorted beforehand according to the given comparison function
	 *
	 * @param arr			The array to search
	 * @param el			The given element to find
	 * @param compFunc		The comparison function
	 *
	 * @return				The index
	 */
	const binarySearch = function(arr, el, compFunc) {
		let l = 0;
		let r = arr.length - 1;
		
		while (l < r) {
			let m = Math.floor((r + l) / 2);
			let compRes = compFunc(arr[m], el);
			if (compRes === 0) {
				return m;
			} else if (compRes < 0) {
				l = m + 1;
			} else {
				r = m;
			}
		}
		
		return l;
	}
	
	// Public static methods
	/**
	 * Generate an array of input sizes from the sizes of the structure's sources
	 *
	 * @return	The array of input sizes
	 */
	StructureProto.generateInputSizes = function() {
		const inputSizes = [];
		this.sources.forEach(function(source, i) {
			inputSizes.push(source.size);
		});
		return inputSizes;
	}
	
	/**
	 * Generate an array of output sizes from the sizes of the structure's sinks
	 *
	 * @return	The array of output sizes
	 */
	StructureProto.generateOutputSizes = function() {
		const outputSizes = [];
		this.sinks.forEach(function(sink, i) {
			outputSizes.push(sink.size);
		});
		return outputSizes;
	}
	
	/**
	 * Updates a WeakMap which contains every gate the structure holds as a key and the layer it is on as its value
	 * The layer a gate is on is equal to how many connections away from a source it is on its longest path. Loops are ignored
	 *
	 * @return	A WeakMap whose keys are the structure's gates and whose values are those gates' layer
	 */
	StructureProto.generateStructureMap = function() {
		return Gate.generateStructureMap(this.sources);
	}
	
	/**
	 * Configure a gate's input to receive data from a source
	 *
	 * @param inputTo		The gate to send the data to
	 * @param inputIndex	The index of the gate's input to send the data to
	 * @param sourceIndex	The index of the source that provides the data
	 */
	StructureProto.sendInputTo = function(inputTo, inputIndex, sourceIndex) {
		this.flagUpdate();
		inputTo.setInput(this.sources[sourceIndex], 0, inputIndex);
	}
	
	/**
	 * Configure a gate's input to stop receiving data from a source
	 *
	 * @param inputTo		The gate to stop sending data to
	 * @param inputIndex	The index of the gate's input to stop sending data to
	 */
	StructureProto.removeInputTo = function(inputTo, inputIndex) {
		this.flagUpdate();
		inputTo.removeInput(inputIndex);
	}
	
	/**
	 * Configure a sink to receive data from a gate's output
	 *
	 * @param outputFrom	The gate to receive data from
	 * @param outputIndex	The index of the gate's output to receive data from
	 * @param sinkIndex		The index of the sink
	 */
	StructureProto.takeOutputFrom = function(outputFrom, outputIndex, sinkIndex) {
		this.flagUpdate();
		this.sinks[sinkIndex].setInput(outputFrom, outputIndex, 0);
	}
	
	/**
	 * Configure a sink to stop receiving data from a gate's output
	 *
	 * @param sinkIndex		The index of the sink
	 */
	StructureProto.removeOutputFrom = function(sinkIndex) {
		this.flagUpdate();
		this.sinks[sinkIndex].removeInput(0);
	}
	
	/**
	 * Add a source of a given size
	 *
	 * @param size			The source's size
	 */
	StructureProto.addSource = function(size) {
		this.flagUpdate();
		this.sources.push(Source(size));
	}
	
	/**
	 * Add a sink of a given size
	 *
	 * @param size			The sink's size
	 */
	StructureProto.addSink = function(size) {
		this.flagUpdate();
		this.sinks.push(size);
	}
	
	/**
	 * Remove a source
	 *
	 * @param sourceIndex	The source's index
	 */
	StructureProto.removeSource = function(sourceIndex) {
		this.flagUpdate();
		this.sources.splice(sourceIndex, 1);
	}
	
	/**
	 * Remove a sink
	 *
	 * @param sinkIndex		The sink's index
	 */
	StructureProto.removeSink = function(sinkIndex) {
		this.flagUpdate();
		this.sinks.splice(sinkIndex, 1);
	}
	
	/**
	 * Move a source to a new index
	 * Removes source, then adds it at the new index
	 *
	 * @param sourceIndex	The index of the source to move
	 * @param newIndex		The index to move it to
	 */
	StructureProto.moveSource = function(sourceIndex, newIndex) {
		const source = this.sources.splice(sourceIndex, 1);
		this.sources.splice(newIndex, 0, source);
	}
	
	/**
	 * Move a sink to a new index
	 * Removes sink, then adds it at the new index
	 *
	 * @param sinkIndex		The index of the sink to move
	 * @param newIndex		The index to move it to
	 */
	StructureProto.moveSink = function(sinkIndex, newIndex) {
		const sink = this.sinks.splice(sinkIndex, 1);
		this.sinks.splice(newIndex, 0, sink);
	}
	
	/**
	 * Set the data for a particular source gate
	 *
	 * @param sourceIndex	The source gate
	 * @param data			The data
	 */
	StructureProto.setData = function(sourceIndex, data) {
		this.sources[sourceIndex].setData(data);
	}
	
	/**
	 * Get the data from a particular sink gate
	 *
	 * @param sinkIndex		The sink gate
	 *
	 * @return				The data
	 */
	StructureProto.getData = function(sinkIndex) {
		return this.sinks[sinkIndex].getData();
	}
	
	/**
	 * Creates a Structure object
	 * Holds the information about the structure of a compound gate
	 * 
	 * @param sources	An array of Source objects
	 * @param sinks		An array of Sink objects
	 */
	var Structure = function(sources, sinks) {
		// Create object
		const structure = Object.create(StructureProto);
		
		// Internal object state
		let structureMap;
		let updateRequired = true;
		
		// Public properties
		structure.sources = sources;
		structure.sinks = sinks;
		
		// Public methods		
		/**
		 * Notifies the structure that an update will be required
		 * The update isn't actually performed until one if its methods that requires the structure to be up to date is called
		 */
		structure.flagUpdate = function() {
			updateRequired = true;
		}
		
		/**
		 * Updates the structure's layer map and gate array
		 * Also adds event listeners to all gates contained within the structure to flag it for an update if their inputs change
		 */
		structure.update = function(required) {
			// If no required flag was provided or the flag is true, perform the update
			if (required || required === undefined) {
				const that = this;
				
				// Store the previous layer map and gate array
				const previousLayerMap = structureMap ? structureMap.layerMap : new Map();
				const previousGateArray = structureMap ? structureMap.gateArray : [];
				
				// Update the structure map and set the updateRequired flag to false
				structureMap = this.generateStructureMap();
				updateRequired = false;
				
				// Add flagUpdate as an event listener to all new gates added to the structure
				structureMap.gateArray.forEach(function(gate) {
					if (!previousLayerMap.has(gate)) {
						gate.addEventListener("inputset", that.flagUpdate);
						gate.addEventListener("inputremoved", that.flagUpdate);
					}
				});
				
				// Remove flagUpdate as an event listener to all gates removed from the structure
				previousGateArray.forEach(function(gate) {
					if (!structureMap.layerMap.has(gate)) {
						gate.removeEventListener("inputset", that.flagUpdate);
						gate.removeEventListener("inputremoved", that.flagUpdate);
					}
				});
			}
		}
		
		structure.calculate = function() {
			// If necessary, update the layer map, gate array, and index map
			this.update(updateRequired);
			
			Gate.propagate(sources, structureMap);
		}
		
		/**
		 * Creates and returns a deep copy of this structure
		 *
		 * @return		The copy
		 */
		structure.getCopy = function() {
			// Update if necessary
			this.update(updateRequired);
			const copyMap = new Map();
			
			// Create copies of each gate in the structure and store them in a Map
			structureMap.gateArray.forEach(function(gate) {
				copyMap.set(gate, gate.getCopy());
			});
			
			// Loop through each gate in the structure and connect the copies in the same way as their originals
			structureMap.gateArray.forEach(function(gate) {
				// Retrieve copy
				const gateCopy = copyMap.get(gate);
				
				// Loop through copies of output gates and add the current gate copy as an input using the connection information
				gate.getOutputMap().forEach(function(connections, outputTo) {
					const outputToCopy = copyMap.get(outputTo);
					connections.forEach(function(connection) {
						outputToCopy.setInput(gateCopy, connection.outputIndex, connection.inputIndex);
					});
				});
			});
			
			// Create new sources array and sinks array
			const sourcesCopy = [];
			const sinksCopy = [];
			
			// Add the copied sources into the new sources array
			sources.forEach(function(source) {
				sourcesCopy.push(copyMap.get(source));
			});
			
			// Add the copied sinks into the new sinks array
			sinks.forEach(function(sink) {
				sinksCopy.push(copyMap.get(sink));
			});
			
			// Return the newly constructed structure copy
			return Structure(sourcesCopy, sinksCopy);
		}
		
		structure.toObj = function() {
			this.update(updateRequired);
			
			const obj = Object.create(null);
			obj.sources = [];
			sources.forEach(function(source) {
				obj.sources.push(source.uid);
			});
			obj.sinks = [];
			sinks.forEach(function(sink) {
				obj.sinks.push(sink.uid);
			});
			obj.gates = Gate.gatesToObj(structureMap.gateArray);
			
			return Object.freeze(obj);
		}
		
		// Freeze and return object
		return Object.freeze(structure);
	}
	
	Structure.fromObj = function(obj) {
		const gateArray = Gate.gatesFromObj(obj.gates);
		const sources = [];
		obj.sources.forEach(function(sourceId) {
			sources.push(gateArray.idMap[sourceId]);
		});
		const sinks = [];
		obj.sinks.forEach(function(sinkId) {
			sinks.push(gateArray.idMap[sinkId]);
		});
		
		return Structure(sources, sinks);
	}
	
	// Bind prototype to constructor
	Structure.prototype = StructureProto;
	
	// Bind constructor to prototype
	StructureProto.constructor = Structure;
	
	// Freeze prototype
	Object.freeze(StructureProto);
}

// CompoundGate scope
{
	var CompoundGate = function(structure, state) {
		const compoundGate = Object.create(Gate(structure.generateInputSizes(), structure.generateOutputSizes(), CompoundGate, state));
		
		compoundGate.setCalculator(function(data) {
			// Load this gate's inputs into the structure's sources
			data.inputs.forEach(function(data, i) {
				structure.setData(i, data);
			});
			
			// Calculate
			structure.calculate();
			
			// Load the structure's sinks' outputs into this gate's outputs
			let outputs = [];
			data.outputSizes.forEach(function(size, i) {
				outputs.push(structure.getData(i));
			});
			
			// Return outputs
			return outputs;
		});
		
		compoundGate.setArgumentProvider(function() {
			return [structure.getCopy()];
		}, function() {
			return [structure.toObj()];
		});
		
		return Object.freeze(compoundGate);
	}
	
	CompoundGate.fromObj = function(obj) {
		const structure = Structure.fromObj(obj.arguments[0]);
		const state = Object.create(null);
		state.inputs = obj.inputs;
		state.outputs = obj.outputs;
		
		return CompoundGate(structure, state);
	}
	
	GateRegistry.add(CompoundGate, "CompoundGate");
}

// GateFactory scope
{
	var GateFactory = function(inputSizes, outputSizes) {
		// Create structure based on initially provided input and output sizes
		let structure;
		{
			const sources = [];
			if (inputSizes) {
				inputSizes.forEach(function(size) {
					sources.push(Source(size));
				});
			}
			
			const sinks = [];
			if (outputSizes) {
				outputSizes.forEach(function(size) {
					sinks.push(Sink(size));
				});
			}
			
			structure = Structure(sources, sinks);
		}
		
		// Factory function creates and returns a CompoundGate object using a copy of the structure
		const gateFactory = function() {
			return CompoundGate(structure.getCopy(), gateFactory);
		}

		gateFactory.update = function(required) {
			structure.update(required);
		}

		gateFactory.sendInputTo = function(inputTo, inputIndex, sourceIndex) {
			structure.sendInputTo(inputTo, inputIndex, sourceIndex);
		}
		
		gateFactory.removeInputTo = function(inputTo, inputIndex) {
			structure.removeInputTo(inputTo, inputIndex);
		}
		
		gateFactory.takeOutputFrom = function(outputFrom, outputIndex, sinkIndex) {
			structure.takeOutputFrom(outputFrom, outputIndex, sinkIndex);
		}
		
		gateFactory.removeOutputFrom = function(sinkIndex) {
			structure.removeOutputFrom(sinkIndex);
		}
		
		gateFactory.addSource = function(size) {
			structure.addSource(size);
		}
		
		gateFactory.addSink = function(size) {
			structure.addSink(size);
		}
		
		gateFactory.removeSource = function(sourceIndex) {
			structure.removeSource(sourceIndex);
		}
		
		gateFactory.removeSink = function(sinkIndex) {
			structure.removeSink(sinkIndex);
		}
		
		gateFactory.moveSource = function(sourceIndex, newIndex) {
			structure.moveSource(sourceIndex, newIndex);
		}
		
		gateFactory.moveSink = function(sinkIndex, newIndex) {
			structure.moveSink(sinkIndex, newIndex);
		}
		
		// Return factory function
		return gateFactory;
	}
}

// Wire scope
{
	/**
	 * Creates a Wire object
	 * Outputs its input
	 */
	var Wire = function(throughput, inputSizes, outputSizes, state) {
		// Input validation
		if (throughput <= 0) throw new Error("The throughput cannot be less than or equal to zero");
		if (throughput === Infinity) throw new Error("The throughput cannot be Infinity");
		if (!inputSizes) inputSizes = [throughput];
		if (!outputSizes) outputSizes = [throughput];
		
		// Makes sure the sum of the inputs is equal to the wire's throughput
		const inputSum = inputSizes.reduce(function(acc, size) {
			return acc += size;
		});
		if (inputSum !== throughput) throw new Error("The sum of the input sizes must be equal to the wire's throughput");
		
		// Makes sure the sum of the outputs is equal to the wire's throughput
		const outputSum = outputSizes.reduce(function(acc, size) {
			return acc += size;
		});
		if (outputSum !== throughput) throw new Error("The sum of the output sizes must be equal to the wire's throughput");
		
		// Create object
		const wire = Object.create(Gate(inputSizes.slice(), outputSizes.slice(), Wire, state));
		
		//Set the calculator function, which outputs its inputs in the correct outputSizes
		wire.setCalculator(function(data) {
			let outputs = [];
			let outputData = [];
			let i = 0; // Keep track of the overall index
			let outputSizeRunningTotal = data.outputSizes[0];
			let outputSizeIndex = 0;
			
			// Pipe inputs into outputs
			data.inputs.forEach(function(inputData, j) {
				inputData.forEach(function(datum, k) {
					if (outputSizeRunningTotal === i) {
						outputSizeIndex++;
						outputSizeRunningTotal += data.outputSizes[outputSizeIndex];
						outputs.push(outputData);
						outputData = [];
					}
					
					outputData.push(datum);
					i++;
				});
			});
			
			outputs.push(outputData);
			return outputs;
		});
		
		// Set the argumentProvider function, which returns the wire's arguments
		wire.setArgumentProvider(function() {
			return [throughput, inputSizes, outputSizes];
		});
		
		// Freeze and return object
		return Object.freeze(wire);
	}
	
	GateRegistry.add(Wire, "Wire");
}

// Toggle scope
{
	/**
	 * Creates a Toggle object
	 * Outputs a state that can be set publicly
	 */
	var Toggle = function(state) {
		// Create object
		const toggle = Object.create(Gate([], [1], Toggle, state));
		
		// Internal object state
		let data = 0;
		
		// Set the calculator function, which outputs the internal state
		toggle.setCalculator(function() {
			return [[data]];
		});
		
		// Set the argumentProvider function, which returns the toggle's arguments
		toggle.setArgumentProvider(function() {
			return [];
		});
		
		// Public methods
		/**
		 * Set the value of the internal state
		 */
		toggle.setData = function(newData) {
			data = newData;
		}
		
		/**
		 * Get the value of the internal state
		 */
		toggle.getData = function() {
			return data;
		}
		
		/**
		 * Toggle the value of the internal state
		 * If the state is equal to 0, set it to 1. Otherwise, set it to 0
		 */
		toggle.toggle = function() {
			data = data === 0 ? 1 : 0;
		}
		
		// Freeze and return object
		return Object.freeze(toggle);
	}
	
	GateRegistry.add(Toggle, "Toggle");
}

// Nand scope
{
	/**
	 * Creates a Nand object
	 */
	var Nand = function(state) {
		// Create object
		const nand = Object.create(Gate([1, 1], [1], Nand, state));
		
		nand.setCalculator(function(data) {
			return [[Number(!(data.inputs[0][0] && data.inputs[1][0]))]];
		});
		
		// Set the argumentProvider function, which returns the nand's arguments
		nand.setArgumentProvider(function() {
			return [];
		});
		
		// Freeze and return object
		return Object.freeze(nand);
	}
	
	GateRegistry.add(Nand, "Nand");
}

// VariableNand scope
{
	/**
	 * Creates a VariableOr object
	 * An or gate that accepts a variable number of inputs and returns the orred result
	 */
	var VariableNand = function(state) {
		// Create object
		const variableNand = Object.create(Gate([Infinity], [1], VariableNand, state));
		
		variableNand.setCalculator(function(data) {
			return [[Number(data.inputs[0].some(function(input) {
				return input === 0;
			}))]];
		});
		
		// Set the argumentProvider function, which returns the variableNand's arguments
		variableNand.setArgumentProvider(function() {
			return [];
		});
		
		return Object.freeze(variableNand);
	}
	
	GateRegistry.add(VariableNand, "VariableNand");
}

// VariableInv scope
{
	/**
	 * Creates a VariableInv object
	 * An inverter gate that accepts a variable number of inputs and returns the same number of outputs, inverted
	 */
	var VariableInv = function(state) {
		const variableInv = Object.create(Gate([Infinity], [Infinity], VariableInv, state));
		
		variableInv.setCalculator(function(data) {
			const outputs = [];
			
			data.inputs.forEach(function(inputData) {
				const outputData = [];
				inputData.forEach(function(datum) {
					outputData.push(datum === 0 ? 1 : 0);
				});
				outputs.push(outputData);
			});
			
			return outputs;
		});
		
		// Set the argumentProvider function, which returns the variableInv's arguments
		variableInv.setArgumentProvider(function() {
			return [];
		});
		
		return Object.freeze(variableInv);
	}
	
	GateRegistry.add(VariableInv, "VariableInv");
}

// Inv scope
// {
	const nand0 = Nand();
	var Inv = GateFactory([1], [1]);
	Inv.sendInputTo(nand0, 0, 0);
	Inv.sendInputTo(nand0, 1, 0);
	Inv.takeOutputFrom(nand0, 0, 0);
// }

// VariableAnd scope
// {
	const variableNand0 = VariableNand();
	const inv0 = Inv();
	var VariableAnd = GateFactory([Infinity], [1]);
	inv0.setInput(variableNand0, 0, 0);
	VariableAnd.sendInputTo(variableNand0, 0, 0);
	VariableAnd.takeOutputFrom(inv0, 0, 0);
// }

// VariableOr scope
// {
	const variableInv0 = VariableInv();
	const variableNand1 = VariableNand();
	var VariableOr = GateFactory([Infinity], [1]);
	variableNand1.setInput(variableInv0, 0, 0);
	VariableOr.sendInputTo(variableInv0, 0, 0);
	VariableOr.takeOutputFrom(variableNand1, 0, 0);
// }

var variableOr0 = VariableOr();
var source0 = Source(5);
variableOr0.setInput(source0, 0, 0);
