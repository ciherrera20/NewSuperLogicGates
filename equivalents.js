// _new(f) is equivalent to new f(), except that it can't be used to call class constructors
const _new = function(constructor) {
    const that = Object.create(constructor.prototype);
    constructor.call(that);
    return that;
}

const _class = function(constructor) {
	constructor.prototype = new Object();
}

class Parent0 {
	publicField = "publicField";
	#privateField = "privateField";
	static staticPublicField = "staticPublicField";
	static #staticPrivateField = "staticPrivateField";
	
	constructor() {
	}
	
	publicMethod() {
		console.log("publicMethod");
		console.log(this.#privateField);
	}
	
	static staticPublicMethod() {
		console.log("staticPublicMethod");
		console.log(Parent0.#staticPrivateField);
		console.log(this.#privateField);
	}
}

var parent0 = new Parent0();
var parent1 = new Parent0();

Parent0.staticPublicMethod.call(parent0);