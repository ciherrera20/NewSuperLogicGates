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
			//if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
			if (!callback) throw new Error("A callback function must be provided");
			
			// Add callback
			if (callbacks[eventName]) {
				callbacks[eventName].push(callback);
			}
		}
		
		/**
		 * Remove a given event listener callback for a given event
		 *
		 * @param eventName		The name of the event
		 * @param callback		The callback to remove
		 */
		EventDispatcher.removeEventListener = function(eventName, callback) {
			// Input validation
			//if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
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
		
		EventDispatcher.getEventNames = function() {
			return eventNames.slice();
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
		if (inputSize !== outputSize && inputSize !== Infinity) throw new Error("Input size must match output size");
		
		// Create object
		const connection = Object.create(ConnectionProto);
		
		// Public properties
		connection.outputFrom = outputFrom;
		connection.outputIndex = outputIndex;
		connection.inputTo = inputTo;
		connection.inputIndex = inputIndex;
		connection.size = inputSize;
		
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
		console.blog(state);
		
		// Input validation
		inputSizes.forEach(function(inputSize){
			if (inputSize <= 0) throw new Error("An input's size cannot be less than or equal to 0");
		});
		outputSizes.forEach(function(outputSize) {
			if (outputSize <= 0) throw new Error("An output's size cannot be less than or equal to 0");
		});
		
		// Create object
		const gate = Object.create(GateProto);
		Object.assign(gate, EventDispatcher(["inputset", "outputset", "inputremoved", "outputremoved", "calculation", "removed", "replaced"]));
		
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
		let replacedBy;
		
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
			
			delete inputsFrom[inputIndex];
			
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
		 * Remove a gate from a structure by severing all its input and output connections
		 */
		gate.remove = function() {
			inputsFrom.forEach(function(connection) {
				connection.sever();
			});
			outputsTo.forEach(function(output) {
				output.forEach(function(connection) {
					connection.sever();
				});
			});
			
			const e = Object.create(null);
			e.parent = this;
			this.dispatchEvent(GEvent("removed", e));
			
			let that = this;
			this.getEventNames().forEach(function(name) {
				that.getEventListeners(name).forEach(function(callback) {
					that.removeEventListener(name, callback);
				});
			});
		}
		
		/**
		 * Replace a gate in a structure with another, given gate
		 */
		gate.replace = function(replacement) {
			inputsFrom.forEach(function(connection, i) {
				connection.sever();
				const replacementSize = replacement.getInputSize(i);
				if (replacementSize === connection.size || replacementSize === Infinity) {
					replacement.setInput(connection.outputFrom, connection.outputIndex, i);
				}
			});
			outputsTo.forEach(function(output, i) {
				output.forEach(function(connection) {
					connection.sever();
					if (replacement.getOutputSize(i) === connection.size) {
						connection.inputTo.setInput(replacement, i, connection.inputIndex);
					}
				});
			});
						
			replacedBy = replacement;
			
			const e = Object.create(null);
			e.parent = this;
			e.replacement = replacement;
			this.dispatchEvent(GEvent("replaced", e));
			
			let that = this;
			this.getEventNames().forEach(function(name) {
				that.getEventListeners(name).forEach(function(callback) {
					that.removeEventListener(name, callback);
					replacement.addEventListener(name, callback);
				});
			});
		}
		
		/**
		 * Get the gate that this gate was replaced by
		 */
		gate.replacedBy = function() {
			return replacedBy;
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
			let that = this;
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
			
			obj[SaveRegistry.lookupName("name")] = GateRegistry.lookupConstructor(constructor);
			obj[SaveRegistry.lookupName("args")] = argumentProvider();
			obj[SaveRegistry.lookupName("uid")] = this.uid;
			obj[SaveRegistry.lookupName("inputs")] = inputs;
			obj[SaveRegistry.lookupName("outputs")] = outputs;
			obj[SaveRegistry.lookupName("inputsFrom")] = [];
			
			inputsFrom.forEach(function(connection, i) {
				const inputFrom = Object.create(null);
				inputFrom[SaveRegistry.lookupName("outputFrom")] = connection.outputFrom.uid;
				inputFrom[SaveRegistry.lookupName("outputIndex")] = connection.outputIndex;
				inputFrom[SaveRegistry.lookupName("inputIndex")] = i;
				obj[SaveRegistry.lookupName("inputsFrom")].push(inputFrom);
			});
			
			return Object.freeze(obj);
		}
		
		// Debugging getters
		gate.blogInputs = function() {
			console.blog("Inputs", this.uid, ...inputs);
		}
		
		gate.blogOutputs = function() {
			console.blog("Outputs", this.uid, ...outputs);
		}
		
		gate.getStructureMap = function() {
			return structureMap;
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
			return structureMap.layerMap.get(firstGate) - structureMap.layerMap.get(secondGate);
		}
		
		console.blog("Layer map:", structureMap.layerMap);
		
		structureMap.gateArray.sort(compareGateLayer);
		console.blog("Gate array:", structureMap.gateArray);
		
		structureMap.gateArray.forEach(function(gate, i) {
			structureMap.indexMap.set(gate, i);
		});
		console.blog("Index map:", structureMap.indexMap);
		
		console.bgroupEnd();
		return Object.freeze(structureMap);
	}
	
	Gate.propagate = function(sources, structureMap) {
		let maps = []; // Temporary array to store the resulting connection maps from calculating the source gates
		let sortedGates = Object.create(null); // An array of gates sorted by layer, from highest to smallest
		let sortedUids = Object.create(null);
		let visited = new WeakMap(); // A weak map of visited gates
		
		console.bgroup("Propagation started");
		console.bgroup("Calculating sources");
		
		// Add the result of calculating the source gates to sortedGates and maps
		sources.forEach(function(source) {
			console.bgroup("Gate", source.uid, source);
			source.blogInputs();
			source.blogOutputs();
			let result = source.calculate();
			if (blog) {
				let affectedUids = [];
				result.forEach(function(affectedOutput) {
					affectedUids.push(affectedOutput.uid);
				});
				console.log("Calculate", affectedUids);
			}
			source.blogOutputs();
			console.bgroupEnd();
			maps.push(result.connectionMap);
		});
		
		// Combine connection maps and add output gates to sortedGates array
		let connectionMap = combineMaps(maps);
		for (let gate of connectionMap.keys()) {
			const index = structureMap.indexMap.get(gate);
			sortedGates[index] = gate;
			sortedUids[index] = gate.uid;
		}
		
		console.blog("Sorted gates ", sortedUids);
		console.bgroupEnd();
		console.bgroup("Calculating affected gates");
		
		// Evaluate each of the sorted gates, starting at the lowest layer, and add the results of their calculations to sortedGates and connectionMap
		let length = -1; // Number of elements iterable with forEach in sortedGates
		while (length !== 0) {
			length = 0;
			Object.keys(sortedGates).forEach(function(key) {
				length++;
				
				const gate = sortedGates[key]; // Get gate at the lowest layer
				delete sortedGates[key];
				delete sortedUids[key];
				console.bgroup("Gate ", gate.uid, gate);
				
				gate.blogInputs();
				console.bgroup("Loading inputs");
				// Loop through all connections connecting to it
				connectionMap.get(gate).forEach(function(connection) {
					// Load the inputs represented by those connections
					console.blog("Input", connection.inputIndex, gate.uid, "From", connection.outputFrom.uid);
					gate.loadInput(connection);
				});
				console.bgroupEnd();
				gate.blogInputs();
				
				gate.blogOutputs();
				// If the gate has not yet been visited, call its calculate function and add the results to sortedGates and connectionMap
				if (!visited.has(gate)) {
					console.bgroup("Calculating");
					let result = gate.calculate(); // Store result of the calculation
					let affectedUids = [];
					
					// Add all affected gates to sortedGates
					result.forEach(function(outputTo) {
						const index = structureMap.indexMap.get(outputTo);
						affectedUids.push(outputTo.uid);
						sortedGates[index] = outputTo;
						sortedUids[index] = outputTo.uid;
					});
					console.bgroupEnd();
					console.blog("Affected gates", affectedUids);
					
					// Combine current connection map and the connection map from the result
					connectionMap = combineMaps([connectionMap, result.connectionMap]);
					
					// Keep track of which gates have been visited to prevent recursion
					visited.set(gate, true);
				} else {
					console.blog("Already visited ", gate.uid);
				}
				gate.blogOutputs();
				console.blog("Sorted gates ", sortedUids);
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
		const uid = SaveRegistry.lookupName("uid");
		const inputsFrom = SaveRegistry.lookupName("inputsFrom");
		const outputFrom = SaveRegistry.lookupName("outputFrom");
		const outputIndex = SaveRegistry.lookupName("outputIndex");
		const inputIndex = SaveRegistry.lookupName("inputIndex");
		
		const gateArray = [];
		const idMap = Object.create(null);
		obj.forEach(function(gateObj) {
			const gate = Gate.fromObj(gateObj);
			gateArray.push(gate);
			idMap[gateObj[uid]] = gate;
		});
		obj.forEach(function(gateObj) {
			const gate = idMap[gateObj[uid]];
			gateObj[inputsFrom].forEach(function(inputFrom) {
				gate.setInput(idMap[inputFrom[outputFrom]], inputFrom[outputIndex], inputFrom[inputIndex]);
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
		const name = SaveRegistry.lookupName("name");
		const inputs = SaveRegistry.lookupName("inputs");
		const outputs = SaveRegistry.lookupName("outputs");
		const args = SaveRegistry.lookupName("args");
		
		const constructor = GateRegistry.lookupName(obj[name]);
		
		if (constructor.fromObj) {
			return constructor.fromObj(obj);
		} else {		
			const state = Object.create(null);
			state.inputs = obj[inputs];
			state.outputs = obj[outputs];
			
			return constructor(...obj[args], state);
		}
	}
	
	// Bind prototype to constructor
	Gate.prototype = GateProto;
	
	// Bind constructor to prototype
	GateProto.constructor = Gate;
	
	// Freeze prototype
	Object.freeze(GateProto);
}

// SaveRegistry scope
{
	const abrvMap = Object.create(null);
	const nameMap = Object.create(null);
	
	var SaveRegistry = Object.create(null);
	
	SaveRegistry.add = function(name, abrv) {
		nameMap[name] = abrv;
		abrvMap[abrv] = name;
	}
	
	SaveRegistry.lookupName = function(name) {
		let abrv = nameMap[name]
		return abrv || name;
	}
	
	SaveRegistry.lookupAbrv = function(abrv) {
		return abrvMap[abrv];
	}
	
	SaveRegistry.add("name", "n");
	SaveRegistry.add("args", "a");
	SaveRegistry.add("uid", "u");
	SaveRegistry.add("inputs", "i");
	SaveRegistry.add("outputs", "o");
	SaveRegistry.add("inputsFrom", "if");
	SaveRegistry.add("outputFrom", "of");
	SaveRegistry.add("outputIndex", "oi");
	SaveRegistry.add("inputIndex", "ii");
	SaveRegistry.add("sources", "so");
	SaveRegistry.add("sinks", "si");
	SaveRegistry.add("gates", "g");
	SaveRegistry.add("structure", "st");
	SaveRegistry.add("inputSizes", "is");
	SaveRegistry.add("outputSizes", "os");
	SaveRegistry.add("calculatorBody", "cb");
	
	Object.freeze(SaveRegistry);
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
		constructorMap.set(constructor, name);
		nameMap[name] = constructor;
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
	
	StructureProto.getSource = function(sourceIndex) {
		return this.sources[sourceIndex];
	}
	
	StructureProto.getSink = function(sinkIndex) {
		return this.sinks[sinkIndex];
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
				let sinkCopy = copyMap.get(sink);
				if (!sinkCopy) {
					sinkCopy = sink.getCopy();
				}
				sinksCopy.push(sinkCopy);
			});
			
			// Return the newly constructed structure copy
			return Structure(sourcesCopy, sinksCopy);
		}
		
		structure.toObj = function() {
			this.update(updateRequired);
			
			const sourcesAbrv = SaveRegistry.lookupName("sources");
			const sinksAbrv = SaveRegistry.lookupName("sinks");
			const gates = SaveRegistry.lookupName("gates");
			
			const obj = Object.create(null);
			obj[sourcesAbrv] = [];
			sources.forEach(function(source) {
				obj[sourcesAbrv].push(source.uid);
			});
			obj[sinksAbrv] = [];
			sinks.forEach(function(sink) {
				obj[sinksAbrv].push(sink.uid);
			});
			obj[gates] = Gate.gatesToObj(structureMap.gateArray);
			
			return Object.freeze(obj);
		}
		
		// Freeze and return object
		return Object.freeze(structure);
	}
	
	Structure.fromObj = function(obj) {
		const gateArray = Gate.gatesFromObj(obj.gates);
		
		const sources = [];
		obj[SaveRegistry.lookupName("sources")].forEach(function(sourceId) {
			sources.push(gateArray.idMap[sourceId]);
		});
		
		const sinks = [];
		obj[SaveRegistry.lookupName("sinks")].forEach(function(sinkId) {
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
	var CompoundGate = function(name, structure, outOfDate, state) {
		const compoundGate = Object.create(Gate(structure.generateInputSizes(), structure.generateOutputSizes(), CompoundGate, state));
		outOfDate = outOfDate || false;
		
		compoundGate.defineEvents(["outofdate"]);
		
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
			return [name, structure.getCopy(), outOfDate];
		}, function() {
			return [name, structure.toObj(), outOfDate];
		});
		
		compoundGate.flagOutOfDate = function() {
			outOfDate = true;
			
			const e = Object.create(null);
			e.parent = this;
			this.dispatchEvent(GEvent("outofdate", e));
		}
		
		compoundGate.isOutOfDate = function() {
			return outOfDate;
		}
		
		Object.defineProperty(compoundGate, "replace", {
			enumerable: true,
			value() {
				const replacement = GateRegistry.lookupName(name)();
				Object.getPrototypeOf(this).replace(replacement);
				return replacement;	
			}
		});
		
		return Object.freeze(compoundGate);
	}
	
	CompoundGate.fromObj = function(obj) {
		const structure = Structure.fromObj(obj[SaveRegistry.lookupName("args")][0]);
		const state = Object.create(null);
		state.inputs = obj.inputs;
		state.outputs = obj.outputs;
		
		return CompoundGate(structure, state);
	}
	
	GateRegistry.add(CompoundGate, "CompoundGate");
}

// GateFactory scope
{
	var GateFactory = function(name, inputSizes, outputSizes, structure) {
		// Create structure based on initially provided input and output sizes
		if (!structure) {
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
		
		const gates = [];
		
		// Factory function creates and returns a CompoundGate object using a copy of the structure
		const gateFactory = function() {
			const gate = CompoundGate(name, structure.getCopy());
			gates.push(gate);
			
			return gate;
		}

		const flagOutOfDate = function() {
			while (gates.length > 0) {
				gates.pop().flagOutOfDate();
			}
		}

		gateFactory.update = function(required) {
			structure.update(required);
		}

		gateFactory.sendInputTo = function(inputTo, inputIndex, sourceIndex) {
			flagOutOfDate();
			structure.sendInputTo(inputTo, inputIndex, sourceIndex);
		}
		
		gateFactory.removeInputTo = function(inputTo, inputIndex) {
			flagOutOfDate();
			structure.removeInputTo(inputTo, inputIndex);
		}
		
		gateFactory.takeOutputFrom = function(outputFrom, outputIndex, sinkIndex) {
			flagOutOfDate();
			structure.takeOutputFrom(outputFrom, outputIndex, sinkIndex);
		}
		
		gateFactory.removeOutputFrom = function(sinkIndex) {
			flagOutOfDate();
			structure.removeOutputFrom(sinkIndex);
		}
		
		gateFactory.addSource = function(size) {
			flagOutOfDate();
			structure.addSource(size);
		}
		
		gateFactory.addSink = function(size) {
			flagOutOfDate();
			structure.addSink(size);
		}
		
		gateFactory.removeSource = function(sourceIndex) {
			flagOutOfDate();
			structure.removeSource(sourceIndex);
		}
		
		gateFactory.removeSink = function(sinkIndex) {
			flagOutOfDate();
			structure.removeSink(sinkIndex);
		}
		
		gateFactory.moveSource = function(sourceIndex, newIndex) {
			flagOutOfDate();
			structure.moveSource(sourceIndex, newIndex);
		}
		
		gateFactory.moveSink = function(sinkIndex, newIndex) {
			flagOutOfDate();
			structure.moveSink(sinkIndex, newIndex);
		}
		
		gateFactory.toObj = function() {
			const obj = Object.create(null);
			obj[SaveRegistry.lookupName("name")] = name;
			obj[SaveRegistry.lookupName("structure")] = structure.toObj();
			return Object.freeze(obj);
		}
		
		GateRegistry.add(gateFactory, name);
		
		// Return factory function
		return gateFactory;
	}
	
	GateFactory.fromObj = function(obj) {
		return GateFactory(obj[SaveRegistry.lookupName("name")], undefined, undefined, Structure.fromObj(obj[SaveRegistry.lookupName("structure")]));
	}
}

// AtomicGateFactory scope
{
	var AtomicGateFactory = function(name, inputSizes, outputSizes, calculatorBody) {
		inputSizes.forEach(function(inputSize, i) {
			if (inputSize === null) {
				inputSizes[i] = Infinity;
			}
		});
		
		outputSizes.forEach(function(outputSize, i) {
			if (outputSize === null) {
				outputSizes[i] = Infinity;
			}
		});
		
		const gates = [];
		let calculator = Function("inputs", "inputSizes", "outputSizes", calculatorBody);
		
		const validCalculator = function(calculator) {
			let inputs = [];
			inputSizes.forEach(function(size) {
				if (size === Infinity) {
					inputs.push([]);
				} else {
					inputs.push(zeroes(size));
				}
			});
			let outputs = calculator(inputs, inputSizes.slice(), outputSizes.slice());
			return outputs.every(function(output, i) {
				if (outputSizes[i] === Infinity) {
					return true;
				} else {
					return output.length === outputSizes[i]
				}
			});
		}
		
		if (!validCalculator(calculator)) {
			throw new Error("The given calculator's results do not match its output sizes");
		}
		
		/**
		 * Creates an atomic gate instance, which is just a regular gate with a calculator function provided by the user
		 */
		const atomicGateFactory = function(state) {
			const atomicGate = Object.create(Gate(inputSizes, outputSizes, atomicGateFactory, state));
			
			gates.push(atomicGate);
			
			atomicGate.setCalculator(function(data) {
				return calculator(data.inputs, data.inputSizes.slice(), data.outputSizes.slice());
			});
			atomicGate.setArgumentProvider(function(){return []});
			
			return Object.freeze(atomicGate);
		}
		
		const replaceGates = function() {
			gates.forEach(function(gate) {
				gate.replace(atomicGateFactory());
			});
		}
		
		/**
		 * Set the calculator body for all gates created with this gate factory
		 */
		atomicGateFactory.setCalculatorBody = function(newCalculatorBody) {
			const newCalculator = Function("inputs", "inputSizes", "outputSizes", newCalculatorBody);
			if (validCalculator(newCalculator)) {
				calculatorBody = newCalculatorBody;
				calculator = newCalculator;
			} else {
				throw new Error("The given calculator's results do not match its output sizes");
			}
		}
		
		atomicGateFactory.toObj = function() {
			const obj = Object.create(null);
			obj[SaveRegistry.lookupName("name")] = name;
			obj[SaveRegistry.lookupName("inputSizes")] = inputSizes;
			obj[SaveRegistry.lookupName("outputSizes")] = outputSizes;
			obj[SaveRegistry.lookupName("calculatorBody")] = calculatorBody;
			return Object.freeze(obj);
		}
		
		atomicGateFactory.setInputSizes = function(newInputSizes) {
			inputSizes = newInputSizes;
			replaceGates();
		}
		
		atomicGateFactory.setOutputSizes = function(newOutputSizes) {
			outputSizes = newOutputSizes;
			replaceGates();
		}
		
		GateRegistry.add(atomicGateFactory, name);
		
		return Object.freeze(atomicGateFactory);
	}
	
	AtomicGateFactory.fromObj = function(obj) {
		const name = obj[SaveRegistry.lookupName("name")];
		const inputSizes = obj[SaveRegistry.lookupName("inputSizes")];
		const outputSizes = obj[SaveRegistry.lookupName("outputSizes")];
		const calculatorBody = obj[SaveRegistry.lookupName("calculatorBody")];
		return AtomicGateFactory(name, inputSizes, outputSizes, calculatorBody);
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

/*// Inv scope
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
variableOr0.setInput(source0, 0, 0);*/
