"use strict";

// Logging functions for debugging
let blog = false;
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

const LogicGates = Object.create(null);
//{
	/**
	 * Create an array and populate it with the given number of zeroes
	 * If the given number is Infinity, return the array without any zeroes
	 *
	 * @param num	The number of zeroes
	 *
	 * @return		The array
	 */
	const zeroes = function(num) {
		var arr = [];
		if (num === Infinity) {
			return arr;
		}
		
		for (var i = 0; i < num; i++) {
			arr.push(0);
		}
		return arr;
	}

	// EventDispatcher constructor
	const EventDispatcher = (function(){
		// Store object states
		const states = new WeakMap();
		
		/**
		 * Populates EventDispatcher from a config object
		 *
		 * @param config		Config object to assign properties from
		 *
		 * @return				The EventDispatcher object
		 */
		const populate = function(config) {
			// Create internal object state
			const state = Object.create(null);
			states.set(this, state);
			
			state.eventNames = config.eventNames;
			state.callbacks = Object.create(null);
			
			this.defineEvents(config.eventNames);
		}
		
		/**
		 * Creates an EventDispatcher object
		 * Handles dispatching events and calling registered callbacks
		 *
		 * @param eventNames	Array of event names to define
		 */
		const EventDispatcher = function(eventNames) {
			// Creates and returns the EventDispatcher object
			if (!this) {
				const eventDispatcher = Object.create(EventDispatcher.prototype);
				EventDispatcher.call(eventDispatcher, ...arguments);
				return Object.freeze(eventDispatcher);
			}
			
			// Creates a config object to populate the EventDispatcher object with
			const config = Object.create(null);
			config.eventNames = eventNames;
			populate.call(this, config);
		}
		
		// Public methods
		/**
		 * Define events given an array of event names
		 *
		 * @param eventNames	Array of event names to define
		 */
		EventDispatcher.prototype.defineEvents = function(eventNames) {
			// Retrieve internal state
			const state = states.get(this);
			const callbacks = state.callbacks;
			
			// Add event name arrays to callback object
			eventNames.forEach(function(eventName) {
				if (!callbacks[eventName]) {
					callbacks[eventName] = [];
				}
			});	
		}
		
		/**
		 * Dispatch an event to the registered callbacks
		 *
		 * @param gEvent		The gate event to dispatch
		 */
		EventDispatcher.prototype.dispatchEvent = function(gEvent) {
			// Retrieve internal state
			const state = states.get(this);
			const callbacks = state.callbacks;
			
			// Retrieve event name
			const eventName = gEvent.type;
			
			// Input validation
			if (!callbacks[eventName]) throw new Error("The event \"" + eventName + "\" has not been defined");
			
			// Execute all callbacks for the given event with the given event data
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
		EventDispatcher.prototype.addEventListener = function(eventName, callback) {
			// Retrieve internal state
			const state = states.get(this);
			const callbacks = state.callbacks;
			
			// Input validation
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
		EventDispatcher.prototype.removeEventListener = function(eventName, callback) {
			// Retrieve internal state
			const state = states.get(this);
			const callbacks = state.callbacks;
			
			// Input validation
			if (!callback) throw new Error("A callback function must be provided");
			let callbackIndex = callbacks[eventName].indexOf(callback);
			
			// Remove callback
			if (callbackIndex !== -1) {
				callbacks[eventName].splice(callbackIndex, 1);
			}
		}
		
		/**
		 * Return all callbacks registered for the given event name
		 *
		 * @param eventName		The event name
		 *
		 * @return				An array of callbacks
		 */
		EventDispatcher.prototype.getEventListeners = function(eventName) {
			// Retrieve internal state
			const state = states.get(this);
			const callbacks = state.callbacks;
			return callbacks[eventName];
		}
		
		/**
		 * Return a copy of the array of all event names
		 *
		 * @return				The copy of the array of all event names
		 */
		EventDispatcher.prototype.getEventNames = function() {
			// Retrieve internal state
			const state = states.get(this);
			const eventNames = state.eventNames;
			return eventNames.slice();
		}
		
		return EventDispatcher;
	})();

	const GEvent = (function() {
		/**
		 * Populates a GEvent object from a config object
		 *
		 * @param config		The config object
		 *
		 * @return				The GEvent object
		 */
		const populate = function(config) {
			this.type = config.eventName;
			Object.assign(this, config.eventProperties);
		}
		
		/**
		 * Creates a GEvent object
		 * Stands for Gate Event
		 * Holds information about the event, including a type property whose value is the event's name
		 *
		 * @param eventName			The name of the event
		 * @param eventProperties	Additional properties to by added to the gEvent object
		 */
		const GEvent = function(eventName, eventProperties) {
			// Creates and returns the GEvent object
			if (!this) {
				const gEvent = Object.create(GEvent.prototype);
				GEvent.call(gEvent, ...arguments);
				return Object.freeze(gEvent);
			}
			
			// Creates a config object to populate the GEvent object with
			const config = Object.create(null);
			config.eventName = eventName;
			config.eventProperties = eventProperties;
			populate.call(this, config);
		}
		
		return GEvent;
	})();

	const Connection = (function() {
		/**
		 * Populates a Connection object from a config object
		 *
		 * @param config		The config object
		 *
		 * @return				The Connection object
		 */
		const populate = function(config) {
			// Input validation
			if (config.outputIndex >= config.outputFrom.numOutputs) throw new Error("The output index must not be greater than or equal to the number of outputs the given gate has");
			if (config.inputIndex >= config.inputTo.numInputs) throw new Error("The input index must not be greater than or equal to the number of inputs the given gate has");
			const inputSize = config.inputTo.getInputSize(config.inputIndex);
			const outputSize = config.outputFrom.getOutputSize(config.outputIndex);
			if (inputSize !== outputSize && inputSize !== Infinity) throw new Error("Input size must match output size");
			
			// Set public properties
			this.outputFrom = config.outputFrom;
			this.outputIndex = config.outputIndex;
			this.inputTo = config.inputTo;
			this.inputIndex = config.inputIndex;
			this.size = inputSize;
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
		 * @returns				The Connection object
		 */
		const Connection = function(outputFrom, outputIndex, inputTo, inputIndex) {
			if (!this) {
				const connection = Object.create(Connection.prototype);
				Connection.call(connection, ...arguments);
				return Object.freeze(connection);
			}
			
			// Create a config object to populate the Connection object with
			const config = Object.create(null);
			config.outputFrom = outputFrom;
			config.outputIndex = outputIndex;
			config.inputTo = inputTo;
			config.inputIndex = inputIndex;
			populate.call(this, config);
		}
		
		/**
		 * Severs a connection
		 * Calls removeInput(this.inputIndex) on the inputTo gate
		 *
		 * @return	True or false, depending on whether the connection was succesfully severed
		 */
		Connection.prototype.sever = function() {
			return this.inputTo.removeInput(this.inputIndex);
		}
		
		return Connection;
	})();

	const Gate = (function() {
		// Store object states
		const states = new WeakMap();
		
		let instances = 0;
		
		/**
		 * Populates a Gate object from a config object
		 *
		 * @param config		The config object
		 *
		 * @return				The Gate object
		 */
		const populate = function(config) {			
			const state = Object.create(null);
			states.set(this, state);
			
			EventDispatcher.call(this, ["inputset", "outputset", "inputremoved", "outputremoved", "calculation", "removed", "replaced"]);
			
			// Internal object state
			state.inputSizes = config.inputSizes;
			state.outputSizes = config.outputSizes;
			state.inputs = config.inputs || [];
			state.outputs = config.outputs || [];
			state.previousOutputs = [];
			state.inputsFrom = Object.create(null);
			state.outputsTo = Object.create(null);
			state.outputMap = new Map();
			state.structureMap;
			state.updateRequired = true;
			
			// Load initial data into input and output arrays if it was not provided
			if (!config.inputs) {
				config.inputSizes.forEach(function(inputSize) {
					state.inputs.push(zeroes(inputSize));
				});
			}
			if (!config.outputs) {
				config.outputSizes.forEach(function(outputSize) {
					state.outputs.push([]);
					state.previousOutputs.push([]);
				});
			}
			
			// Public properties
			this.uid = instances++;
			this.numInputs = config.inputSizes.length;
			this.numOutputs = config.outputSizes.length;
		}
		
		/**
		 * Creates a Gate object
		 *
		 * @param inputSizes		An array holding the sizes of each input
		 * @param outputSizes		An array holding the sizes of each output
		 */
		const Gate = function(inputSizes, outputSizes) {
			if (!this) {
				const gate = Object.create(Gate.prototype);
				Gate.call(gate, ...arguments);
				return Object.freeze(gate);
			}
			
			const config = Object.create(null);
			config.inputSizes = inputSizes;
			config.outputSizes = outputSizes;
			populate.call(this, config);
		}
		Gate.prototype = Object.create(EventDispatcher.prototype);
		Gate.prototype.constructor = Gate;
		
		Gate.getStates = function() {
			return states;	
		}
		
		Gate.prototype.getInputSize = function(inputIndex) {
			return states.get(this).inputSizes[inputIndex];
		}
		
		Gate.prototype.getOutputSize = function(outputIndex) {
			return states.get(this).outputSizes[outputIndex];
		}
		
		Gate.prototype.getInputsFrom = function() {
			return states.get(this).inputsFrom;
		}
		
		Gate.prototype.getOutputMap = function() {
			return states.get(this).outputMap;
		}
		
		Gate.prototype.getOutput = function(outputIndex) {
			return states.get(this).outputs[outputIndex];
		}
		
		Gate.prototype.setInput = function(outputFrom, outputIndex, inputIndex) {
			const state = states.get(this);
			const inputsFrom = state.inputsFrom;
			
			// If the input has already been set, remove it first
			if (inputsFrom[inputIndex]) {
				this.removeInput(inputIndex);
			}
			
			// Create connection object and set it as an input
			const connection = Connection(outputFrom, outputIndex, this, inputIndex);
			inputsFrom[inputIndex] = connection;
			
			// Automatically sets the connection as an output
			setOutput.call(outputFrom, connection);
			
			// Create and dispatch event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("inputset", e));
		}
		
		const setOutput = function(connection) {
			const state = states.get(this);
			const outputsTo = state.outputsTo;
			const outputMap = state.outputMap;
			
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
			
			// Create and dispatch outputset event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("outputset", e));
		}
		
		Gate.prototype.removeInput = function(inputIndex) {
			const state = states.get(this);
			const inputsFrom = state.inputsFrom;
			
			const connection = inputsFrom[inputIndex];
			delete inputsFrom[inputIndex];
			
			// Create and dispatch inputremoved event
			const e = Object.create(null);
			e.parent = this;
			e.connection = connection;
			this.dispatchEvent(GEvent("inputremoved", e));
			
			removeOutput.call(connection.outputFrom, connection);
		}
		
		const removeOutput = function(connection) {
			const state = states.get(this);
			const outputsTo = state.outputsTo;
			const outputMap = state.outputMap;
			
			const outputMapEntry = outputMap.get(connection.inputTo);
			const connectionIndex = outputsTo[connection.outputIndex].indexOf(connection);
			const connectionMapIndex = outputMapEntry.indexOf(connection);
			
			// Remove connection from both outputsTo and outputMap
			outputsTo[connection.outputIndex].splice(connectionIndex, 1);
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
		}
		
		Gate.prototype.loadInput = function(connection) {
			const state = states.get(this);
			const inputs = state.inputs;
			inputs[connection.inputIndex] = connection.outputFrom.getOutput(connection.outputIndex).slice();
		}
		
		Gate.prototype.calculate = function(calculator) {
			const state = states.get(this);
			const previousOutputs = state.outputs;
			const inputs = state.inputs;
			const inputSizes = state.inputSizes;
			const outputSizes = state.outputSizes;
			const outputsTo = state.outputsTo;
			
			// Create data object to pass to the calculator function
			const data = Object.create(null);
			data.inputs = inputs;
			data.inputSizes = inputSizes;
			data.outputSizes = outputSizes;
			
			// Compute outputs
			const outputs = calculator(Object.freeze(data));
			state.outputs = outputs;
			
			const result = Object.create(null);
			result.affectedGates = [];
			result.connectionMap = new Map();
			
			// Add output connections that changed to the result object
			let that = this;
			outputs.forEach(function(outputData, i) {
				// If any piece of output data has changed, add the connection to the result object
				outputData.some(function(datum, j) {
					if (datum !== previousOutputs[i][j]) {
						// Loop through connections array and add each connection to the result object
						const connections = outputsTo[i];
						if (connections) {
							connections.forEach(function(connection) {
								if (result.connectionMap.has(connection.inputTo)) {
									// Add connection to the inputTo gate's entry in the result's connectionMap
									result.connectionMap.get(connection.inputTo).push(connection);
								} else {
									// Create an entry in the result's connectionMap for the inputTo gate
									result.affectedGates.push(connection.inputTo);
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
		
		Gate.prototype.propagate = function() {
			const state = states.get(this);
			const updateRequired = state.updateRequired;
			this.update(updateRequired);
			Gate.propagate([this], state.structureMap);
		}
		
		Gate.prototype.remove = function() {
			const state = states.get(this);
			const inputsFrom = state.inputsFrom;
			const outputsTo = state.outputsTo;
			
			// Sever all input connections
			Object.keys(inputsFrom).forEach(function(key) {
				inputsFrom[key].sever();
			});
			
			// Sever all output connections
			Object.keys(outputsTo).forEach(function(key) {
				outputsTo[key].forEach(function(connection) {
					connection.sever();
				});
			});
			
			// Create and dispatch removed event
			const e = Object.create(null);
			e.parent = this;
			this.dispatchEvent(GEvent("removed", e));
			
			// Remove all event listeners
			let that = this;
			this.getEventNames().forEach(function(eventName) {
				that.getEventListeners(eventName).forEach(function(callback) {
					that.removeEventListener(eventName, callback);
				});
			});
		}
		
		Gate.prototype.replace = function(replacement) {
			const state = states.get(this);
			const inputsFrom = state.inputsFrom;
			const outputsTo = state.outputsTo;
			
			// Sever all input connections and set the replacement's inputs
			Object.keys(inputsFrom).forEach(function(key) {
				const connection = inputsFrom[key];
				const replacementSize = replacement.getInputSize(key);
				console.log(replacementSize, connection.size, connection);
				connection.sever();
				if (replacementSize === connection.size || replacementSize === Infinity) {
					replacement.setInput(connection.outputFrom, connection.outputIndex, key);
				}
			});
			
			// Sever all output connections
			Object.keys(outputsTo).forEach(function(key) {
				outputsTo[key].forEach(function(connection) {
					connection.sever();
					if (replacement.getOutputSize(key) === connection.size) {
						connection.inputTo.setInput(replacement, key, connection.inputIndex);
					}
				});
			});
			
			state.replacedBy = replacement;
			
			// Create and dispatch replaced event
			const e = Object.create(null);
			e.parent = this;
			e.replacedBy = replacement;
			this.dispatchEvent(GEvent("replaced", e));
			
			let that = this;
			this.getEventNames().forEach(function(name) {
				that.getEventListeners(name).forEach(function(callback) {
					that.removeEventListener(name, callback);
					replacement.addEventListener(name, callback);
				});
			});
		}
		
		Gate.prototype.replacedBy = function() {
			return states.get(this).replacedBy;
		}
		
		Gate.prototype.flagUpdate = function() {
			states.get(this).updateRequired = true;
		}
		
		Gate.prototype.update = function(required) {
			// If no required flag was provided or the flag is true, perform the update
			if (required || required === undefined) {
				const that = this;
				const state = states.get(this);
				const structureMap = state.structureMap;
				
				// Store the previous layer map and gate array
				const previousLayerMap = structureMap ? structureMap.layerMap : new Map();
				const previousGateArray = structureMap ? structureMap.gateArray : [];
				
				// Update the structure map and set the updateRequired flag to false
				state.structureMap = Gate.generateStructureMap([this]);
				state.updateRequired = false;
				
				// Add flagUpdate as an event listener to all new gates added to the structure
				state.structureMap.gateArray.forEach(function(gate) {
					if (!previousLayerMap.has(gate)) {
						gate.addEventListener("inputset", that.flagUpdate);
						gate.addEventListener("inputremoved", that.flagUpdate);
					}
				});
				
				// Remove flagUpdate as an event listener to all gates removed from the structure
				previousGateArray.forEach(function(gate) {
					if (!state.structureMap.layerMap.has(gate)) {
						gate.removeEventListener("inputset", that.flagUpdate);
						gate.removeEventListener("inputremoved", that.flagUpdate);
					}
				});
			}
		}
		
		// Gate.prototype.getCopy = function(copy) {
			// if (!copy) {
				// copy = Object.create(Gate.prototype);
			// }
			
			// const state = states.get(this);
			// const inputSizes = state.inputSizes;
			// const outputSizes = state.outputSizes;
			
			// const config = Object.create(null);
			// config.inputSizes = inputSizes.slice();
			// config.outputSizes = outputSizes.slice();
			// populate.call(copy, config);
			
			// return Object.freeze(copy);
		// }
		
		Gate.prototype.blogInputs = function() {
			console.blog("Inputs", this.uid, ...states.get(this).inputs);
		}
		
		Gate.prototype.blogOutputs = function() {
			console.blog("Outputs", this.uid, ...states.get(this).outputs);
		}
		
		Gate.prototype.blogStructureMap = function() {
			console.blog("Structure map", this.uid, states.get(this).structureMap);
		}
		
		Gate.prototype.setCalculator = function(calculator) {
			Object.defineProperty(this, "calculate", {
				enumerable: true,
				configurable: false,
				writable: false,
				value() {
					return Object.getPrototypeOf(this).calculate.call(this, calculator);
				}
			});
		}
		
		Gate.prototype.toObj = function() {
			const state = states.get(this);
			const inputsFrom = state.inputsFrom;
			const obj = Object.create(null);
			
			obj.uid = this.uid;
			obj.inputSizes = state.inputSizes;
			obj.outputSizes = state.outputSizes;
			obj.inputs = state.inputs;
			obj.outputs = state.outputs;
			obj.inputsFrom = [];
			
			Object.keys(inputsFrom).forEach(function(key) {
				const connection = inputsFrom[key];
				const inputFrom = Object.create(null);
				inputFrom.outputFrom = connection.outputFrom.uid;
				inputFrom.outputIndex = connection.outputIndex;
				inputFrom.inputIndex = Number(key);
				obj.inputsFrom.push(inputFrom);
			});
			
			return obj;
		}
		
		Gate.fromObj = function(obj) {
			if (this === Gate) {
				const gate = Object.create(Gate.prototype);
				Gate.fromObj.call(gate, obj);
				return gate;
			}
			
			const config = Object.create(null);
			config.inputSizes = obj.inputSizes;
			config.outputSizes = obj.outputSizes;
			config.inputs = obj.inputs;
			config.outputs = obj.outputs;
			populate.call(this, config);
		}
		
		Gate.traceOutputs = function(gate, callback, depth, history) {
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
						Gate.traceOutputs(outputTo, callback, depth + 1, new Map(history));
					} else {
						Gate.traceOutputs(outputTo, callback, depth + 1, history);
						reused = true;
					}
				}
			}
		}
		
		Gate.traceInputs = function(gate, callback, depth, history) {
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
			const inputsFrom = gate.getInputsFrom();
			Object.keys(inputsFrom).forEach(function(key) {
				const inputFrom = inputsFrom[key].outputFrom;
				if (!history.has(inputFrom)) {
					if (reused) {
						Gate.traceInputs(inputFrom, callback, depth + 1, new Map(history));
					} else {
						Gate.traceInputs(inputFrom, callback, depth + 1, history);
						reused = true;
					}
				}
			});
		}
		
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
		
		Gate.generateSourceArray = function(sinks) {
			console.bgroup("Generating source array");
			const sourceMap = new WeakMap();
			const sourceArray = [];
			const sourceUidArray = [];
			
			sinks.forEach(function(sink) {
				Gate.traceInputs(sink, function(gate) {
					if (Object.keys(gate.getInputsFrom()).length === 0) {
						if (!sourceMap.has(gate)) {
							sourceMap.set(gate, true);
							sourceArray.push(gate);
							sourceUidArray.push(gate.uid);
						}
					}
				});
			});
			console.blog("Source array", sourceArray);
			console.blog("Source uids", sourceUidArray);
			console.bgroupEnd();
			
			return sourceArray;
		}
		
		Gate.generateStructureMap = function(sources) {
			console.bgroup("Generating structure map");
		
			// Create object
			const structureMap = Object.create(null);
			structureMap.sources = sources;
			structureMap.layerMap = new WeakMap();
			structureMap.gateArray = [];
			structureMap.indexMap = new WeakMap();
			
			// Call traceOutputs on each source gate
			sources.forEach(function(source) {
				Gate.traceOutputs(source, function(gate, layer) {
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
		
		Gate.generateStructureCopy = function(sources, sinks, structureMap) {
			const newStructureMap = Object.create(null);
			newStructureMap.sources = [];
			newStructureMap.layerMap = new WeakMap();
			newStructureMap.gateArray = [];
			newStructureMap.indexMap = new WeakMap();
			
			const copyMap = new Map();
			structureMap.gateArray.forEach(function(gate) {
				let gateCopy;
				if (gate.type === "Source" && sources.indexOf(gate) === -1) {
					gateCopy = gate.getCopy(true);
				} else {
					gateCopy = gate.getCopy();
				}
				
				copyMap.set(gate, gateCopy);
				newStructureMap.layerMap.set(gateCopy, structureMap.layerMap.get(gate));
				newStructureMap.indexMap.set(gateCopy, structureMap.indexMap.get(gate));
			});
			
			structureMap.gateArray.forEach(function(gate) {
				const gateCopy = copyMap.get(gate);
				newStructureMap.gateArray.push(gateCopy);
				
				gate.getOutputMap().forEach(function(connections, outputTo) {
					const outputToCopy = copyMap.get(outputTo);
					connections.forEach(function(connection) {
						outputToCopy.setInput(gateCopy, connection.outputIndex, connection.inputIndex);
					});
				});
			});
			
			const sourcesCopy = [];
			const sinksCopy = [];
			sources.forEach(function(source) {
				sourcesCopy.push(copyMap.get(source));
			});
			sinks.forEach(function(sink) {
				sinksCopy.push(copyMap.get(sink));
			});
			structureMap.sources.forEach(function(source) {
				newStructureMap.sources.push(copyMap.get(source));
			});
			
			const structureCopy = Object.create(null);
			structureCopy.sources = sourcesCopy;
			structureCopy.sinks = sinksCopy;
			structureCopy.structureMap = newStructureMap;
			return structureCopy;
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
				console.bgroup("Gate", source.uid, source.type);
				source.blogInputs();
				source.blogOutputs();
				let result = source.calculate();
				if (blog) {
					let affectedUids = [];
					result.affectedGates.forEach(function(affectedGate) {
						affectedUids.push(affectedGate.uid);
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
					console.bgroup("Gate", gate.uid, gate.type);
					
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
						result.affectedGates.forEach(function(outputTo) {
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
		
		return Gate;
	})();
	
	const SaveRegistry = (function(){
		const SaveRegistry = Object.create(null);
		
		return Object.freeze(SaveRegistry);
	})();
	
	const AtomicGate = (function() {
		const states = new WeakMap();
		
		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			
			this.type = config.type;
			this.setCalculator(config.calculator);
		}
		
		const AtomicGate = function(type, calculator, inputSizes, outputSizes) {
			if (!this) {
				const atomicGate = Object.create(AtomicGate.prototype);
				AtomicGate.call(atomicGate, ...arguments);
				return Object.freeze(atomicGate);
			}
			
			Gate.call(this, inputSizes, outputSizes);
			
			const config = Object.create(null);
			config.type = type;
			config.calculator = calculator;
			populate.call(this, config);
		}
		AtomicGate.prototype = Object.create(Gate.prototype);
		AtomicGate.prototype.constructor = AtomicGate;
		
		AtomicGate.prototype.toObj = function() {
			const obj = Object.getPrototypeOf(AtomicGate.prototype).toObj.call(this);
			obj.type = this.type;
			return obj;
		}
		
		AtomicGate.fromObj = function(obj) {
			if (this === AtomicGate) {
				const atomicGate = Object.create(AtomicGate.prototype);
				AtomicGate.fromObj.call(atomicGate, obj);
			}
			
			Gate.fromObj.call(this, obj);
			
			const config = Object.create(null);
			config.type = obj.type;
			config.calculator = obj.calculator;
			populate.call(this, config);
		}
		
		return AtomicGate;
	})();
	
	const Source = (function() {
		const states = new WeakMap();
		
		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			state.data = config.data || zeroes(config.size);
			this.size = config.size;
		}
		
		const sourceCalculator = function(data) {
			return [states.get(this).data];
		}
		
		const Source = function(size) {
			if (!this) {
				size = size || Infinity;
				
				const source = Object.create(Source.prototype);
				Source.call(source, ...arguments);
				return Object.freeze(source);
			}
			
			let that = this;
			AtomicGate.call(this, "Source", function(data) {
				return sourceCalculator.call(that, data);
			}, [], [size]);
			
			const config = Object.create(null);
			config.size = size;
			populate.call(this, config);
		}
		Source.prototype = Object.create(AtomicGate.prototype);
		Source.prototype.constructor = Source;
		
		Source.prototype.setData = function(newData) {
			const state = states.get(this);
			state.data = newData;
		}
		
		Source.prototype.getCopy = function(copyData) {
			const source = Source(this.size);
			if (copyData) {
				source.setData(states.get(this).data.slice());
			}
			return source;
		}
		
		Source.prototype.toObj = function() {
			const obj = Object.getPrototypeOf(Source.prototype).toObj.call(this);
			obj.size = this.size;
			obj.data = states.get(this).data;
			
			if (obj.outputs[0].length !== 0) {
				delete obj.outputs;
			}
			
			delete obj.inputSizes;
			delete obj.outputSizes;
			delete obj.inputsFrom;
			delete obj.inputs;
			
			return obj;
		}
		
		Source.fromObj = function(obj) {
			if (this === Source) {
				const source = Object.create(Source.prototype);
				Source.fromObj.call(source, obj);
				return Object.freeze(source);
			}
			
			let that = this;
			obj.size = obj.size || Infinity;
			obj.inputSizes = [];
			obj.outputSizes = [obj.size];
			obj.inputsFrom = [];
			if (!obj.outputs) {
				obj.outputs = [obj.data.slice()];
			}
			obj.calculator = function(data) {
				return sourceCalculator.call(that, data);
			}
			
			AtomicGate.fromObj.call(this, obj);
			
			const config = Object.create(null);
			config.size = obj.size;
			config.data = obj.data;
			populate.call(this, config);
		}
		
		return Source;
	})();
	
	const Sink = (function() {
		const states = new WeakMap();
		
		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			
			this.size = config.size;
			state.data = [];	
		}
		
		const sinkCalculator = function(data) {
			states.get(this).data = data.inputs[0];
			return [];
		}
		
		const Sink = function(size) {
			if (!this) {
			size = size || Infinity;
				
				const sink = Object.create(Sink.prototype);
				Sink.call(sink, ...arguments);
				return Object.freeze(sink);
			}
			
			let that = this;
			AtomicGate.call(this, "Sink", function(data) {
				return sinkCalculator.call(that, data);
			}, [size], []);
			
			const config = Object.create(null);
			config.size = size;
			populate.call(this, config);
		}
		Sink.prototype = Object.create(AtomicGate.prototype);
		Sink.prototype.constructor = Sink;
		
		Sink.prototype.getData = function() {
			return states.get(this).data;
		}
		
		Sink.prototype.getCopy = function() {
			return Sink(this.size);
		}
		
		Sink.prototype.toObj = function() {
			const obj = Object.getPrototypeOf(Sink.prototype).toObj.call(this);
			obj.size = this.size;
			
			delete obj.inputSizes;
			delete obj.outputSizes;
			delete obj.outputs;

			return obj;
		}
		
		Sink.fromObj = function(obj) {
			if (this === Sink) {
				const sink = Object.create(Sink.prototype);
				Sink.fromObj.call(sink, obj);
				return Object.freeze(sink);
			}
			
			let that = this;
			obj.size = obj.size === null ? Infinity : obj.size;
			obj.inputSizes = [obj.size];
			obj.outputSizes = [];
			obj.calculator = function(data) {
				return sinkCalculator.call(that, data);
			}
			
			AtomicGate.fromObj.call(this, obj);
			
			const config = Object.create(null);
			config.size = obj.size;
			populate.call(this, config);
		}
		
		return Sink;
	})();
	
	const Wire = (function() {
		const states = new WeakMap();
		
		// Populate Wire instance object
		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			
			this.throughput = config.throughput;
			state.inputSizes = config.inputSizes;
			state.outputSizes = config.outputSizes;
		}
		
		// Calculator function for Wire instances
		const wireCalculator = function(data) {
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
		}
		
		const Wire = function(throughput, inputSizes, outputSizes) {
			if (!this) {
				// Input validation
				if (throughput <= 0) throw new Error("The throughput cannot be less than or equal to zero");
				if (throughput === Infinity) throw new Error("The throughput cannot be 	Infinity");
				if (!inputSizes) inputSizes = [throughput];
				if (!outputSizes) outputSizes = [throughput];
				
				// Make sure the sum of the inputs is equal to the wire's throughput
				const inputSum = inputSizes.reduce(function(acc, size) {
					return acc += size;
				});
				if (inputSum !== throughput) throw new Error("The sum of the input sizes must be equal to the wire's throughput");
				
				// Make sure the sum of the outputs is equal to the wire's throughput
				const outputSum = outputSizes.reduce(function(acc, size) {
					return acc += size;
				});
				if (outputSum !== throughput) throw new Error("The sum of the output sizes must be equal to the wire's throughput");
				
				const wire = Object.create(Wire.prototype);
				Wire.call(wire, ...arguments);
				return Object.freeze(wire);
			}
			
			AtomicGate.call(this, "Wire", wireCalculator, inputSizes, outputSizes);
			
			const config = Object.create(null);
			config.throughput = throughput;
			config.inputSizes = inputSizes;
			config.outputSizes = outputSizes;
			populate.call(this, config);
		}
		Wire.prototype = Object.create(AtomicGate.prototype);
		Wire.prototype.constructor = Wire;
		
		Wire.prototype.getCopy = function() {
			const state = states.get(this);
			return Wire(this.throughput, state.inputSizes.slice(), state.outputSizes.slice());
		}
		
		Wire.prototype.toObj = function() {
			return Object.getPrototypeOf(Wire.prototype).toObj.call(this);
		}
		
		Wire.fromObj = function(obj) {
			// Function entry point in case its this value hasn't been provided
			if (this === Wire) {
				const wire = Object.create(Wire.prototype);
				Wire.fromObj.call(wire, obj);
				return Object.freeze(wire);
			}
			
			// Extend obj for next fromObj call
			obj.calculator = wireCalculator;
			
			AtomicGate.fromObj.call(this, obj);
			
			// Creates a config object to populate the Wire object with
			const inputSum = obj.inputSizes.reduce(function(acc, size) {
				return acc += size;
			});
			const config = Object.create(null);
			config.throughput = inputSum;
			populate.call(this, config);
		}
		
		return Wire;
	})();
	
	const CompoundGate = (function() {
		const states = new WeakMap();

		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			
			state.sources = config.sources;
			state.sinks = config.sinks;
			state.structureMap = config.structureMap || Gate.generateStructureMap(Gate.generateSourceArray(config.sinks));
			state.outOfDate = false;
			this.defineEvents(["outofdate"]);
			
			this.type = config.type;
			this.setCalculator(function(data) {
				const outputs = [];
				config.sources.forEach(function(source, i) {
					source.setData(data.inputs[i]);
				});
				
				Gate.propagate(state.structureMap.sources, state.structureMap);
				
				config.sinks.forEach(function(sink) {
					outputs.push(sink.getData());
				});
				
				return outputs;
			});
		}
		
		const CompoundGate = function(type, sources, sinks, structureMap = undefined) {
			if (!this) {
				const compoundGate = Object.create(CompoundGate.prototype);
				CompoundGate.call(compoundGate, ...arguments);
				return Object.freeze(compoundGate);
			}
			
			const inputSizes = sources.map(function(source) {
				return source.size;
			});
			const outputSizes = sinks.map(function(sink) {
				return sink.size;
			});
			
			Gate.call(this, inputSizes, outputSizes);
			
			const config = Object.create(null);
			config.type = type;
			config.sources = sources;
			config.sinks = sinks;
			config.structureMap = structureMap;
			populate.call(this, config);
		}
		CompoundGate.prototype = Object.create(Gate.prototype);
		CompoundGate.prototype.constructor = CompoundGate;
		
		CompoundGate.prototype.flagOutOfDate = function() {
			const state = states.get(this);
			state.outOfDate = true;
			
			const e = Object.create(null);
			e.parent = this;
			this.dispatchEvent(GEvent("outofdate", e));
		}
		
		CompoundGate.prototype.isOutOfDate = function() {
			return states.get(this).outOfDate;
		}
		
		CompoundGate.prototype.replace = function() {
			const replacement = this.constructor.call();
			Object.getPrototypeOf(CompoundGate.prototype).replace.call(this, replacement);
			return replacement;
		}
		
		CompoundGate.prototype.getCopy = function() {
			const state = states.get(this);
			const structureCopy = Gate.generateStructureCopy(state.sources, state.sinks, state.structureMap);
			return CompoundGate(this.type, structureCopy.sources, structureCopy.sinks, structureCopy.structureMap);
		}
		
		CompoundGate.prototype.toObj = function() {
			const state = states.get(this);
			const obj = Object.getPrototypeOf(CompoundGate.prototype).toObj.call(this);
			
			delete obj.inputSizes;
			delete obj.outputSizes;
			
			obj.type = this.type;
			obj.sources = [];
			state.sources.forEach(function(source) {
				obj.sources.push(source.uid);
			});
			obj.sinks = [];
			state.sinks.forEach(function(sink) {
				obj.sinks.push(sink.uid);
			});
			obj.gates = [];
			state.structureMap.gateArray.forEach(function(gate) {
				obj.gates.push(gate.toObj());
			});
			return obj;
		}
		
		CompoundGate.fromObj = function(obj) {
			if (this === CompoundGate) {
				const compoundGate = Object.create(CompoundGate.prototype);
				CompoundGate.fromObj.call(compoundGate, obj);
				return Object.freeze(compoundGate);
			}
			
			const gateArray = obj.registry.gatesFromObj(obj.gates);
			obj.inputSizes = [];
			obj.outputSizes = [];
			obj.sourceGates = obj.sources.map(function(sourceUid) {
				const source = gateArray.idMap[sourceUid];
				obj.inputSizes.push(source.size);
				return source;
			});
			obj.sinkGates = obj.sinks.map(function(sinkUid) {
				const sink = gateArray.idMap[sinkUid];
				obj.outputSizes.push(sink.size);
				return sink;
			});
			console.log(obj);
			
			Gate.fromObj.call(this, obj);
			
			const config = Object.create(null);
			config.type = obj.type;
			config.sources = obj.sourceGates;
			config.sinks = obj.sinkGates;
			populate.call(this, config);
		}
		
		return CompoundGate;
	})();
	
	const GateRegistry = (function() {
		const states = new WeakMap();
		
		const populate = function(config) {
			const state = Object.create(null);
			states.set(this, state);
			
			state.typeMap = Object.create(null);
			state.constructorMap = new WeakMap();
			
			this.add(Source, "Source");
			this.add(Sink, "Sink");
			this.add(Wire, "Wire");
		}
		
		const GateRegistry = function() {
			if (!this) {
				const gateRegistry = Object.create(GateRegistry.prototype);
				GateRegistry.call(gateRegistry, ...arguments);
				return gateRegistry;
			}
			
			const config = Object.create(null);
			populate.call(this, config);
		}
		
		GateRegistry.prototype.add = function(constructor, type) {
			const state = states.get(this);
			const constructorMap = state.constructorMap;
			const typeMap = state.typeMap;
			constructorMap.set(constructor, type);
			typeMap[type] = constructor;
		}
		
		GateRegistry.prototype.lookupType = function(type) {
			return states.get(this).typeMap[type];
		}
		
		GateRegistry.prototype.lookupConstructor = function(constructor) {
			return states.get(this).constructorMap.get(constructor);
		}
		
		GateRegistry.prototype.defineAtomicGate = (function() {
			const states = new WeakMap();
			
			const populate = function(config) {
				const state = Object.create(null);
				
				state.inputSizes = config.inputSizes;
				state.outputSizes = config.outputSizes;
				state.calculatorBody = config.calculatorBody;
				state.instances = [];
				
				const populate = function() {
					state.instances.push(this);
				}
				
				const CustomAtomicGate = function() {
					if (!this) {
						const customAtomicGate = Object.create(CustomAtomicGate.prototype);
						CustomAtomicGate.call(customAtomicGate);
						return Object.freeze(customAtomicGate);
					}
					
					AtomicGate.call(this, config.type, function(data) {
						return state.calculator(data.inputs, data.inputSizes.slice(), data.outputSizes.slice());
					}, state.inputSizes.slice(), state.outputSizes.slice());
					
					populate.call(this);
				}
				CustomAtomicGate.prototype = Object.create(AtomicGate.prototype);
				CustomAtomicGate.prototype.constructor = CustomAtomicGate;
				CustomAtomicGate.type = config.type;
				
				CustomAtomicGate.prototype.getCopy = function() {
					return CustomAtomicGate();
				}
				
				CustomAtomicGate.prototype.toObj = function() {
					const obj = Object.getPrototypeOf(CustomAtomicGate.prototype).toObj.call(this);
					
					delete obj.inputSizes;
					delete obj.outputSizes;
					
					return obj;
				}
				
				CustomAtomicGate.fromObj = function(obj) {
					if (this === CustomAtomicGate) {
						const customAtomicGate = Object.create(CustomAtomicGate.prototype);
						CustomAtomicGate.fromObj.call(customAtomicGate, obj);
						return Object.freeze(customAtomicGate);
					}
					
					obj.inputSizes = state.inputSizes;
					obj.outputSizes = state.outputSizes;
					obj.calculator = function(data) {
						return state.calculator(data.inputs, data.inputSizes, data.outputSizes);
					}
					
					AtomicGate.fromObj.call(this, obj);
					
					populate.call(this);
				}
				
				CustomAtomicGate.gateType = "atomic";
				
				Object.assign(CustomAtomicGate, defineAtomicGate.prototype);
				states.set(CustomAtomicGate, state);
				
				const calculator = Function("inputs", "inputSizes", "outputSizes", config.calculatorBody);
				if (validCalculator.call(CustomAtomicGate, calculator)) {
					state.calculator = calculator;
				} else {
					state.calculator = defaultCalculator;
				}
				
				this.add(CustomAtomicGate, config.type);
				
				return Object.freeze(CustomAtomicGate);
			}
			
			const defineAtomicGate = function(type, inputSizes, outputSizes, calculatorBody) {
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
				
				const config = Object.create(null);
				config.type = type;
				config.inputSizes = inputSizes;
				config.outputSizes = outputSizes;
				config.calculatorBody = calculatorBody;
				return populate.call(this, config);
			}
			
			const validCalculator = function(calculator) {
				const state = states.get(this);
				const inputSizes = state.inputSizes;
				const outputSizes = state.outputSizes;
				
				const inputs = [];
				inputSizes.forEach(function(size) {
					if (size === Infinity) {
						inputs.push([]);
					} else {
						inputs.push(zeroes(size));
					}
				});
				const outputs = calculator(inputs, inputSizes.slice(), outputSizes.slice());
				return outputs.every(function(output, i) {
					if (outputSizes[i] === Infinity) {
						return true;
					} else {
						return output.length === outputSizes[i];
					}
				});
			}
			
			const defaultCalculator = function(inputs, inputSizes, outputSizes) {
				const outputs = [];
				outputSizes.forEach(function(size) {
					if (size === Infinity) {
						outputs.push([]);
					} else {
						outputs.push(zeroes[size]);
					}
				});
				return outputs;
			}
			
			const replaceGates = function() {
				const state = states.get(this);
				const instances = state.instances;
				instances.forEach(function(gate, i) {
					const newGate = this();
					instances.pop();
					gate.replace(newGate);
					instances[i] = newGate;
				});
			}
			
			defineAtomicGate.prototype.setCalculatorBody = function(newCalculatorBody) {
				const state = states.get(this);
				const newCalculator = Function("inputs", "inputSizes", "outputSizes", newCalculatorBody);
				if (validCalculator.call(this, newCalculator)) {
					state.calclatorBody = newCalculatorBody;
					state.calculator = newCalculator;
				} else {
					throw new Error("The given calculator's results do not match the output sizes");
				}
			}
			
			defineAtomicGate.prototype.setInputSizes = function(newInputSizes) {
				states.get(this).inputSizes = newInputSizes;
				replaceGates.call(this);
			}
			
			defineAtomicGate.prototype.setOutputSizes = function(newOutputSizes) {
				states.get(this).outputSizes = newOutputSizes;
				replaceGates.call(this);
			}
			
			defineAtomicGate.prototype.toObj = function() {
				const state = states.get(this);
				const obj = Object.create(null);
				obj.type = this.type;
				obj.inputSizes = state.inputSizes;
				obj.outputSizes = state.outputSizes;
				obj.calculatorBody = state.calculatorBody;
				return obj;
			}
			
			defineAtomicGate.fromObj = function(obj) {
				return this.defineAtomicGate(obj.type, obj.inputSizes, obj.outputSizes, obj.calculatorBody);
			}
			
			return defineAtomicGate;
		})();
		
		GateRegistry.prototype.defineAtomicGateFromObj = function(obj) {
			return this.defineAtomicGate.fromObj.call(this, obj);
		}
		
		GateRegistry.prototype.defineCompoundGate = (function() {
			const states = new WeakMap();
			
			const populate = function(config) {
				let that = this;
				const state = Object.create(null);
				
				state.type = config.type;
				state.sources = config.sources || [];
				state.sinks = config.sinks || [];
				state.inputSizes = config.inputSizes || [];
				state.outputSizes = config.outputSizes || [];
				state.instances = [];
				state.gateArray = [];
				state.updateRequired = true;
				
				if (!config.sources) {
					state.sources = config.inputSizes.map(function(inputSize) {
						return Source(inputSize);
					});
				} else {
					state.inputSizes = config.sources.map(function(source) {
						return source.size;
					});
				}
				
				if (!config.sinks) {
					state.sinks = config.outputSizes.map(function(outputSize) {
						return Sink(outputSize);
					});
				} else {
					state.outputSizes = config.sinks.map(function(sink) {
						return sink.size;
					});
				}
				
				const populate = function() {
					state.instances.push(this);
				}
				
				const CustomCompoundGate = function() {
					if (!this) {
						const customCompoundGate = Object.create(CustomCompoundGate.prototype);
						CustomCompoundGate.call(customCompoundGate);
						return Object.freeze(customCompoundGate);
					}
					
					update.call(CustomCompoundGate, state.updateRequired);
					const structureCopy = Gate.generateStructureCopy(state.sources, state.sinks, state.structureMap);
					
					CompoundGate.call(this, config.type, structureCopy.sources, structureCopy.sinks, structureCopy.structureMap);
					
					populate.call(this);
				}
				Object.assign(CustomCompoundGate, defineCompoundGate.prototype);
				CustomCompoundGate.prototype = Object.create(CompoundGate.prototype);
				CustomCompoundGate.prototype.constructor = CustomCompoundGate;
				CustomCompoundGate.type = config.type;
				
				CustomCompoundGate.prototype.getCopy = function() {
					const copy = Object.getPrototypeOf(CustomCompoundGate.prototype).getCopy.call(this);
					populate.call(copy);
					return copy;
				}
				
				CustomCompoundGate.fromObj = function(obj) {
					if (this === CustomCompoundGate) {
						const customCompoundGate = Object.create(CustomCompoundGate.prototype);
						CustomCompoundGate.fromObj.call(customCompoundGate, obj);
						return Object.freeze(customCompoundGate);
					}
					
					obj.registry = that;
					
					CompoundGate.fromObj.call(this, obj);
					
					populate.call(this);
				}
				
				CustomCompoundGate.gateType = "compound";
				
				states.set(CustomCompoundGate, state);
				
				if (config.gateArray) {
					config.gateArray.forEach(function(gate) {
						CustomCompoundGate.addGate(gate);
					});
				}
				if (!config.sources) {
					state.sources.forEach(function(source) {
						CustomCompoundGate.addGate(source);
					});
				}
				if (!config.sinks) {
					state.sinks.forEach(function(sink) {
						CustomCompoundGate.addGate(sink);
					});
				}
				
				this.add(CustomCompoundGate, config.type);
				
				return Object.freeze(CustomCompoundGate);
			}
			
			const defineCompoundGate = function(type, inputSizes, outputSizes) {
				const config = Object.create(null);
				config.type = type;
				config.inputSizes = inputSizes;
				config.outputSizes = outputSizes;
				return populate.call(this, config);
			}
			
			const flagUpdate = function() {
				states.get(this).updateRequired = true;
				flagOutOfDate.call(this);
			}
			
			const flagOutOfDate = function() {
				const instances = states.get(this).instances;
				while (instances.length > 0) {
					instances.pop().flagOutOfDate();
				}
			}
			
			const update = function(required) {
				if (required || required === undefined) {
					const state = states.get(this);
					state.structureMap = Gate.generateStructureMap(Gate.generateSourceArray(state.sinks));
					state.updateRequired = false;
				}
			}
			
			defineCompoundGate.prototype.addGate = function(gate) {
				const state = states.get(this);
				const gateArray = state.gateArray;
				gateArray.push(gate);
				
				let that = this;
				gate.addEventListener("inputset", function() {return flagUpdate.call(that)});
				gate.addEventListener("inputremoved", function() {return flagUpdate.call(that)});
				gate.addEventListener("replaced", function(e) {
					const index = gateArray.indexOf(e.parent);
					gateArray[index] = e.replacedBy;
				});
			}
			
			defineCompoundGate.prototype.removeGate = function(gate) {
				const state = states.get(this);
				const gateArray = state.gateArray;
				const index = gateArray.indexOf(gate);
				if (index !== -1) {
					gateArray.splice(index, 1);
				}
				gate.remove();
			}
			
			defineCompoundGate.prototype.sendInputTo = function(inputTo, inputIndex, sourceIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				inputTo.setInput(states.get(this).sources[sourceIndex], 0, inputIndex);
			}
			
			defineCompoundGate.prototype.removeInputTo = function(inputTo, inputIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				inputTo.removeInput(inputIndex);
			}
			
			defineCompoundGate.prototype.takeOutputFrom = function(outputFrom, outputIndex, sinkIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				states.get(this).sinks[sinkIndex].setInput(outputFrom, outputIndex, 0);
			}
			
			defineCompoundGate.prototype.removeOutputFrom = function(sinkIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				states.get(this).sinks[sinkIndex].removeInput(0);	
			}
			
			defineCompoundGate.prototype.addSource = function(size) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				const source = Source(size);
				states.get(this).sources.push(source);
				this.addGate(source);
			}
			
			defineCompoundGate.prototype.addSink = function(size) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				const sink = Sink(size);
				states.get(this).sinks.push(sink);
				this.addGate(sink);
			}
			
			defineCompoundGate.prototype.getSource = function(sourceIndex) {
				return states.get(this).sources[sourceIndex];
			}
			
			defineCompoundGate.prototype.getSink = function(sinkIndex) {
				return states.get(this).sinks[sinkIndex];
			}
			
			defineCompoundGate.prototype.removeSource = function(sourceIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				const source = states.get(this).sources.splice(sourceIndex, i)[0];
				this.removeGate(source);
			}
			
			defineCompoundGate.prototype.removeSink = function(sinkIndex) {
				//flagOutOfDate.call(this);
				flagUpdate.call(this);
				const sink = states.get(this).sinks.splice(sinkIndex, 1)[0];
				this.removeGate(sink);
			}
			
			defineCompoundGate.prototype.moveSource = function(sourceIndex, newIndex) {
				flagOutOfDate.call(this);
				const sources = states.get(this).sources;
				const source = sources.splice(sourceIndex, 1);
				sources.splice(newIndex, 0, source);
			}
			
			defineCompoundGate.prototype.moveSink = function(sinkIndex, newIndex) {
				flagOutOfDate.call(this);
				const sinks = states.get(this).sinks;
				const sink = sinks.splice(sinkIndex, 1);
				sinks.splice(newIndex, 0, sink);
			}
			
			defineCompoundGate.prototype.toObj = function() {
				const state = states.get(this);
				const obj = Object.create(null);
				obj.type = this.type;

				obj.sources = [];
				state.sources.forEach(function(source) {
					obj.sources.push(source.uid);
				});
				obj.sinks = [];
				state.sinks.forEach(function(sink) {
					obj.sinks.push(sink.uid);
				});
				obj.gates = [];
				state.gateArray.forEach(function(gate) {
					obj.gates.push(gate.toObj());
				});

				return obj;
			}
			
			defineCompoundGate.fromObj = function(obj) {
				const gateArray = this.gatesFromObj(obj.gates);
				
				const config = Object.create(null);
				config.type = obj.type;
				config.gateArray = gateArray;
				config.sources = obj.sources.map(function(sourceUid) {
					return gateArray.idMap[sourceUid];
				});
				config.sinks = obj.sinks.map(function(sinkUid) {
					return gateArray.idMap[sinkUid];
				});
				return populate.call(this, config);
			}
			
			return defineCompoundGate;
		})();
		
		GateRegistry.prototype.defineCompoundGateFromObj = function(obj) {
			return this.defineCompoundGate.fromObj.call(this, obj);
		}
		
		GateRegistry.prototype.createGate = function(type, ...args) {
			return this.lookupType(type)(...args);
		}
		
		GateRegistry.prototype.gateFromObj = function(obj) {
			const constructor = this.lookupType(obj.type);
			return constructor.fromObj(obj);
		}
		
		GateRegistry.prototype.gatesFromObj = function(obj) {
			let that = this;
			const gateArray = [];
			const idMap = Object.create(null);
			obj.forEach(function(gateObj) {
				const gate = that.gateFromObj(gateObj);
				gateArray.push(gate);
				idMap[gateObj.uid] = gate;
			});
			obj.forEach(function(gateObj, i) {
				const gate = gateArray[i];
				gateObj.inputsFrom.forEach(function(inputFrom) {
					gate.setInput(idMap[inputFrom.outputFrom], inputFrom.outputIndex, inputFrom.inputIndex);
				});
			});
			
			gateArray.idMap = idMap;
			return gateArray;
		}
		
		GateRegistry.prototype.typeToObj = function(type) {
			return this.lookupType(type).toObj();
		}
		
		GateRegistry.prototype.toObj = function() {
			const state = states.get(this);
			const typeMap = state.typeMap;
			const obj = Object.create(null);
			obj.atomicGateDefinitions = [];
			obj.compoundGateDefinitions = [];
			
			Object.keys(typeMap).forEach(function(type) {
				const constructor = typeMap[type];
				if (constructor.gateType) {
					if (constructor.gateType === "atomic") {
						obj.atomicGateDefinitions.push(constructor.toObj());
					} else if (constructor.gateType === "compound") {
						obj.compoundGateDefinitions.push(constructor.toObj());
					}
				}
			});
			
			return obj;
		}
		
		GateRegistry.fromObj = function(obj) {
			const gateRegistry = Object.create(GateRegistry.prototype);
			const config = Object.create(null);
			populate.call(gateRegistry, config);
			
			obj.atomicGateDefinitions.forEach(function(obj) {
				gateRegistry.defineAtomicGateFromObj(obj);
			});
			obj.compoundGateDefinitions.forEach(function(obj) {
				gateRegistry.defineCompoundGateFromObj(obj);
			});
			
			return gateRegistry;
		}
		
		return GateRegistry;
	})();
//}