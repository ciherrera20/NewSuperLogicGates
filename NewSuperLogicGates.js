"use strict";

var blog = true;
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
			if (callbackIndex === -1) throw new Error("The given callback is not registered with the event \"" + eventName + "\"");
			
			// Remove callback
			callbacks[eventName].splice(callbackIndex, 1);
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
		if (inputSize !== outputSize) throw new Error("Input size must match output size");
		
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
	var Gate = function(inputSizes, outputSizes, constructor) {
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
		const inputs = []; // Array of input data
		let outputs = []; // Array of output data
		let previousOutputs = []; // Array of previously calculated output data
		
		// Load initial data into input and output arrays
		inputSizes.forEach(function(inputSize, i) {
			inputs[i] = zeroes(inputSize);
		});
		outputSizes.forEach(function(outputSize, i) {
			//outputs[i] = zeroes(outputSize);
			outputs[i] = [];
			//previousOutputs[i] = zeroes(outputSize);
			previousOutputs[i] = [];
		});
		
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
			if (!outputEntry) return false;
			
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
		
		// Freeze and return object
		return Object.freeze(gate);
	}
	
	// Bind prototype to constructor
	Gate.prototype = GateProto;
	
	// Bind constructor to prototype
	GateProto.constructor = Gate;
	
	// Freeze prototype
	Object.freeze(GateProto);
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
	var Source = function(size) {
		// Create object
		const source = Object.create(Gate([], [size], Source));
		
		// Internal object state
		let data = zeroes(size); // The source's data
		
		// Set the calculator function, which outputs the source's data
		source.setCalculator(function() {
			return [data];
		});
		
		// Public properties
		source.size = size;
		
		// Public methods
		source.getCopy = function() {
			return Source(size);
		}
		
		/**
		 * Sets the source's data and calls its calculate function
		 */
		source.setData = function(newData) {
			data = newData;
		}
		
		// Freeze and return object
		return Object.freeze(source);
	}
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
	var Sink = function(size) {
		// Create object
		const sink = Object.create(Gate([size], [], Sink));
		
		// Internal object state
		let data = zeroes(size);
		
		// Set the calculator function, which sets the sink's data
		sink.setCalculator(function(newData) {
			data = newData.inputs[0];
			return [];
		});
		
		// Public properties
		sink.size = size;
		
		// Public methods
		sink.getCopy = function() {
			return Sink(size);
		}
		
		/**
		 * Gets the sink's
		 */
		sink.getData = function() {
			return data;
		}
		
		return Object.freeze(sink);
	}
}

// Structure scope
{
	// Prototype object for Structure instances
	const StructureProto = Object.create(null);
	
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
		let layerMap;
		let gateArray;
		let indexMap;
		let updateRequired = false;
		
		// Private functions
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
			return layerMap.get(secondGate) - layerMap.get(firstGate);
		}
		
		/**
		 * Updates a WeakMap which contains every gate the structure holds as a key and the layer it is on as its value
		 * The layer a gate is on is equal to how many connections away from a source it is on its longest path. Loops are ignored
		 *
		 * @return	A WeakMap whose keys are the structure's gates and whose values are those gates' layer
		 */
		 const updateLayerMap = function() {
			layerMap = new WeakMap();
			gateArray = [];
			indexMap = new WeakMap();
			
			// Call traceOutputs on each source gate
			sources.forEach(function(source) {
				traceOutputs(source, function(gate, layer) {
					// If the current gate's layer has not yet been set or is lower than the current layer, set it to the current layer
					const recordedLayer = layerMap.get(gate);
					if (!recordedLayer) {
						gateArray.push(gate);
					}
					if (!recordedLayer || recordedLayer < layer) {
						layerMap.set(gate, layer);
					}
				});
			});
			
			gateArray.sort(compareGateLayer);
			gateArray.forEach(function(gate, i) {
				indexMap.set(gate, i);
			});
		}
		
		// Public methods
		/**
		 * Generate an array of input sizes from the sizes of the structure's sources
		 *
		 * @return	The array of input sizes
		 */
		structure.generateInputSizes = function() {
			const inputSizes = [];
			sources.forEach(function(source, i) {
				inputSizes.push(source.size);
			});
			return inputSizes;
		}
		
		/**
		 * Generate an array of output sizes from the sizes of the structure's sinks
		 *
		 * @return	The array of output sizes
		 */
		structure.generateOutputSizes = function() {
			const outputSizes = [];
			sinks.forEach(function(sink, i) {
				outputSizes.push(sink.size);
			});
			return outputSizes;
		}
		
		/**
		 * Updates the structure's layer map and gate array
		 */
		structure.update = function(required) {
			if (required || required === undefined) {
				updateLayerMap();
			}
		}
		structure.update();
		
		/**
		 * Configure a gate's input to receive data from a source
		 *
		 * @param inputTo		The gate to send the data to
		 * @param inputIndex	The index of the gate's input to send the data to
		 * @param sourceIndex	The index of the source that provides the data
		 */
		structure.sendInputTo = function(inputTo, inputIndex, sourceIndex) {
			updateRequired = true;
			inputTo.setInput(sources[sourceIndex], 0, inputIndex);
		}
		
		/**
		 * Configure a gate's input to stop receiving data from a source
		 *
		 * @param inputTo		The gate to stop sending data to
		 * @param inputIndex	The index of the gate's input to stop sending data to
		 */
		structure.removeInputTo = function(inputTo, inputIndex) {
			updateRequired = true;
			inputTo.removeInput(inputIndex);
		}
		
		/**
		 * Configure a sink to receive data from a gate's output
		 *
		 * @param outputFrom	The gate to receive data from
		 * @param outputIndex	The index of the gate's output to receive data from
		 * @param sinkIndex		The index of the sink
		 */
		structure.takeOutputFrom = function(outputFrom, outputIndex, sinkIndex) {
			updateRequired = true;
			sinks[sinkIndex].setInput(outputFrom, outputIndex, 0);
		}
		
		/**
		 * Configure a sink to stop receiving data from a gate's output
		 *
		 * @param sinkIndex		The index of the sink
		 */
		structure.removeOutputFrom = function(sinkIndex) {
			updateRequired = true;
			sinks[sinkIndex].removeInput(0);
		}
		
		/**
		 * Set the data for a particular source gate
		 *
		 * @param sourceIndex	The source gate
		 * @param data			The data
		 */
		structure.setData = function(sourceIndex, data) {
			sources[sourceIndex].setData(data);
		}
		
		/**
		 * Get the data from a particular sink gate
		 *
		 * @param sinkIndex		The sink gate
		 *
		 * @return				The data
		 */
		structure.getData = function(sinkIndex) {
			return sinks[sinkIndex].getData();
		}
		
		structure.calculate = function() {
			// If necessary, update the layer map, gate array, and index map
			this.update(updateRequired);
			
			let maps = []; // Temporary array to store the resulting connection maps from calculating the source gates
			let sortedGates = []; // An array of gates sorted by layer, from highest to smallest
			let visited = new WeakMap(); // A weak map of visited gates
			
			console.bgroup("Calculating sources");
			
			// Add the result of calculating the source gates to sortedGates and maps
			sources.forEach(function(source) {
				let result = source.calculate();
				console.blog("Calculate ", source, result);
				maps.push(result.connectionMap);
			});
			
			// Combine connection maps and sort gates by layer
			let connectionMap = combineMaps(maps);
			//sortedGates = [...connectionMap.keys()].sort(compareGateLayer);
			
			for (let gate of connectionMap.keys()) {
				sortedGates[indexMap.get(gate)] = gate;
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
							sortedGates[indexMap.get(outputTo)] = outputTo;
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
		}
		
		structure.getCopy = function() {
			this.update(updateRequired);
			const copyMap = new Map();
			
			// Create copies of each gate in the structure and store them in a Map
			gateArray.forEach(function(gate) {
				copyMap.set(gate, gate.getCopy());
			});
			
			// Loop through each gate in the structure and connect the copies in the same way
			gateArray.forEach(function(gate) {
				const gateCopy = copyMap.get(gate);
				gate.getOutputMap().forEach(function(connections, outputTo) {
					const outputToCopy = copyMap.get(outputTo);
					connections.forEach(function(connection) {
						outputToCopy.setInput(gateCopy, connection.outputIndex, connection.inputIndex);
					});
				});
			});
			
			// Construct new sources and sinks arrays
			const sourcesCopy = [];
			const sinksCopy = [];
			sources.forEach(function(source) {
				sourcesCopy.push(copyMap.get(source));
			});
			sinks.forEach(function(sink) {
				sinksCopy.push(copyMap.get(sink));
			});
			
			return Structure(sourcesCopy, sinksCopy);
		}
		
		// Freeze and return object
		return Object.freeze(structure);
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
	var CompoundGate = function(structure, constructor) {
		const compoundGate = Object.create(Gate(structure.generateInputSizes(), structure.generateOutputSizes(), CompoundGate));
		
		Object.defineProperty(compoundGate, "constructor", {
			enumerable: true,
			value: constructor || CompoundGate
		});
		
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
		
		compoundGate.getCopy = function() {
			return CompoundGate(structure.getCopy(), constructor);
		}
		
		return Object.freeze(compoundGate);
	}
}

// GateFactory scope
{
	var GateFactory = function(name, inputSizes, outputSizes) {
		const obj = Object.create(null);

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
		
		obj[name] = function() {
			
		}
		
		return obj[name]
	}
}

// Wire scope
{
	/**
	 * Creates a Wire object
	 * Outputs its input
	 */
	var Wire = function(throughput, inputSizes, outputSizes) {
		// Input validation
		if (throughput <= 0) throw new Error("The throughput cannot be less than or equal to zero");
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
		const wire = Object.create(Gate(inputSizes.slice(), outputSizes.slice(), Wire));
		
		//Set the calculator function, which outputs its inputs in the correct outputSizes
		wire.setCalculator(function(data) {
			let outputs = [];
			let outputData = [];
			let i = 0; // Keep track of the overall index
			let outputSizeRunningTotal = data.outputSizes[0];
			let outputSizeIndex = 0;
			
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
		
		wire.getCopy = function() {
			return Wire(throughput, inputSizes, outputSizes);
		}
		
		// Freeze and return object
		return Object.freeze(wire);
	}
}

// Toggle scope
{
	/**
	 * Creates a Toggle object
	 * Outputs a state that can be set publicly
	 */
	var Toggle = function() {
		// Create object
		const toggle = Object.create(Gate([], [1], Toggle));
		
		// Internal object state
		let state = 0;
		
		// Set the calculator function, which outputs the internal state
		toggle.setCalculator(function(data) {
			return [[state]];
		});
		
		// Public methods
		toggle.getCopy = function() {
			return Toggle();
		}
		
		/**
		 * Set the value of the internal state
		 */
		toggle.setState = function(newState) {
			state = newState;
			return this.calculate();
		}
		
		/**
		 * Get the value of the internal state
		 */
		toggle.getState = function() {
			return state;
		}
		
		/**
		 * Toggle the value of the internal state
		 * If the state is equal to 0, set it to 1. Otherwise, set it to 0
		 */
		toggle.toggle = function() {
			state = state === 0 ? 1 : 0;
			return this.calculate();
		}
		
		// Freeze and return object
		return Object.freeze(toggle);
	}
}

// Nand scope
{
	/**
	 * Creates a Nand object
	 */
	var Nand = function() {
		// Create object
		const nand = Object.create(Gate([1, 1], [1], Nand));
		
		nand.setCalculator(function(data) {
			return [[Number(!(data.inputs[0][0] && data.inputs[1][0]))]];
		});
		
		nand.getCopy = function() {
			return Nand();
		}
		
		// Freeze and return object
		return Object.freeze(nand);
	}
}


/*var wire0 = Wire(4, [1, 1, 1, 1], [4]);
var toggle0 = Toggle();
var toggle1 = Toggle();
var toggle2 = Toggle();
var toggle3 = Toggle();
wire0.setInput(toggle0, 0, 0);
wire0.setInput(toggle1, 0, 1);
wire0.setInput(toggle2, 0, 2);
wire0.setInput(toggle3, 0, 3);*/

/*var nand0 = Nand();
var nand1 = Nand();
var toggle0 = Toggle();
nand0.setInput(toggle0, 0, 0);
nand0.setInput(toggle0, 0, 1);
nand1.setInput(toggle0, 0, 0);
nand1.setInput(toggle0, 0, 1);*/

/*var source0 = Source(5);
var sink0 = Sink(5);
sink0.setInput(source0, 0, 0);*/

/*var source0 = Source(1);
var source1 = Source(1);
var nand0 = Nand();
var sink0 = Sink(1);

sink0.setInput(nand0, 0, 0);
nand0.setInput(source0, 0, 0);
nand0.setInput(source1, 0, 1);

var structure0 = Structure([source0, source1], [sink0]);*/

var source0 = Source(1);
var nand0 = Nand();
var sink0 = Sink(1);

sink0.setInput(nand0, 0, 0);
nand0.setInput(source0, 0, 0);
nand0.setInput(source0, 0, 1);

var inv = CompoundGate(Structure([source0], [sink0]));
var toggle0 = Toggle();

inv.setInput(toggle0, 0, 0);

//source0.setData([1]);
//source1.setData([1]);