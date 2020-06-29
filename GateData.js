{
    var Inv = GateFactory("Inv", [1], [1]);
    const nand0 = Nand();
    Inv.sendInputTo(nand0, 0, 0);
    Inv.sendInputTo(nand0, 1, 0);
    Inv.takeOutputFrom(nand0, 0, 0);
}

{
    var And = GateFactory("And", [1, 1], [1]);
    const nand0 = Nand();
    const inv0 = Inv();
    inv0.setInput(nand0, 0, 0);
    And.sendInputTo(nand0, 0, 0);
    And.sendInputTo(nand0, 1, 1);
    And.takeOutputFrom(inv0, 0, 0);
}

{
    var Or = GateFactory("Or", [1, 1], [1]);
    const inv0 = Inv();
    const inv1 = Inv();
    const nand0 = Nand();
    nand0.setInput(inv0, 0, 0);
    nand0.setInput(inv1, 0, 1);
    Or.sendInputTo(inv0, 0, 0);
    Or.sendInputTo(inv1, 0, 1);
    Or.takeOutputFrom(nand0, 0, 0);
}

{
	var VariableOr = GateFactory("VariableOr", [Infinity], [Infinity]);
	const variableInv0 = VariableInv();
	const variableNand0 = VariableNand();
	variableNand0.setInput(variableInv0, 0, 0);
	VariableOr.sendInputTo(variableInv0, 0, 0);
	VariableOr.takeOutputFrom(variableNand0, 0, 0);
}

{
    var Or8Bit = GateFactory("Or8Bit", [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1]);
    const or0 = Or();
    const or1 = Or();
    const or2 = Or();
    const or3 = Or();
    const or4 = Or();
    const or5 = Or();
    const or6 = Or();
    const or7 = Or();

    Or8Bit.sendInputTo(or0, 0, 0);
    Or8Bit.sendInputTo(or1, 0, 1);
    Or8Bit.sendInputTo(or2, 0, 2);
    Or8Bit.sendInputTo(or3, 0, 3);
    Or8Bit.sendInputTo(or4, 0, 4);
    Or8Bit.sendInputTo(or5, 0, 5);
    Or8Bit.sendInputTo(or6, 0, 6);
    Or8Bit.sendInputTo(or7, 0, 7);

    Or8Bit.sendInputTo(or0, 1, 8);
    Or8Bit.sendInputTo(or1, 1, 9);
    Or8Bit.sendInputTo(or2, 1, 10);
    Or8Bit.sendInputTo(or3, 1, 11);
    Or8Bit.sendInputTo(or4, 1, 12);
    Or8Bit.sendInputTo(or5, 1, 13);
    Or8Bit.sendInputTo(or6, 1, 14);
    Or8Bit.sendInputTo(or7, 1, 15);

    Or8Bit.takeOutputFrom(or0, 0, 0);
    Or8Bit.takeOutputFrom(or1, 0, 1);
    Or8Bit.takeOutputFrom(or2, 0, 2);
    Or8Bit.takeOutputFrom(or3, 0, 3);
    Or8Bit.takeOutputFrom(or4, 0, 4);
    Or8Bit.takeOutputFrom(or5, 0, 5);
    Or8Bit.takeOutputFrom(or6, 0, 6);
    Or8Bit.takeOutputFrom(or7, 0, 7);
}

{
    var Nor = GateFactory("Nor", [1, 1], [1]);
    const inv0 = Inv();
    const or0 = Or();
    inv0.setInput(or0, 0, 0);
    Nor.sendInputTo(or0, 0, 0);
    Nor.sendInputTo(or0, 1, 1);
    Nor.takeOutputFrom(inv0, 0, 0);
}

{
    var Xor = GateFactory("Xor", [1, 1], [1]);
    const nand0 = Nand();
    const nand1 = Nand();
    const nand2 = Nand();
    const nand3 = Nand();
    const nand4 = Nand();
    nand4.setInput(nand2, 0, 0);
    nand4.setInput(nand3, 0, 1);
    nand3.setInput(nand1, 0, 1);
    nand2.setInput(nand0, 0, 0);
    Xor.sendInputTo(nand2, 1, 1);
    Xor.sendInputTo(nand3, 0, 0);
    Xor.sendInputTo(nand0, 0, 0);
    Xor.sendInputTo(nand0, 1, 1);
    Xor.sendInputTo(nand1, 0, 0);
    Xor.sendInputTo(nand1, 1, 1);
    Xor.takeOutputFrom(nand4, 0, 0);
}

{
    var Xnor = GateFactory("Xnor", [1, 1], [1]);
    const nand0 = Nand();
    const nand1 = Nand();
    const or0 = Or();
    nand1.setInput(nand0, 0, 0);
    nand1.setInput(or0, 0, 1);
    Xnor.sendInputTo(nand0, 0, 0);
    Xnor.sendInputTo(nand0, 1, 1);
    Xnor.sendInputTo(or0, 0, 0);
    Xnor.sendInputTo(or0, 1, 1);
    Xnor.takeOutputFrom(nand1, 0, 0);
}

{
    var Mux = GateFactory("Mux", [1, 1, 1], [1]);
    const inv0 = Inv();
    const nand0 = Nand();
    const nand1 = Nand();
    const nand2 = Nand();
    nand0.setInput(inv0, 0, 0);
    nand2.setInput(nand0, 0, 0);
    nand2.setInput(nand1, 0, 1);
    Mux.sendInputTo(inv0, 0, 0);
    Mux.sendInputTo(nand1, 0, 0);
    Mux.sendInputTo(nand0, 1, 1);
    Mux.sendInputTo(nand1, 1, 2);
    Mux.takeOutputFrom(nand2, 0, 0);
}

{
    var Mux8Bit = GateFactory("Mux8Bit", [1, 8, 8], [8]);
	const wire0 = Wire(8, [8], [1, 1, 1, 1, 1, 1, 1, 1]);
	const wire1 = Wire(8, [8], [1, 1, 1, 1, 1, 1, 1, 1]);
	const wire2 = Wire(8, [1, 1, 1, 1, 1, 1, 1, 1], [8]);
    const mux0 = Mux();
    const mux1 = Mux();
    const mux2 = Mux();
    const mux3 = Mux();
    const mux4 = Mux();
    const mux5 = Mux();
    const mux6 = Mux();
    const mux7 = Mux();

    Mux8Bit.sendInputTo(mux0, 0, 0);
    Mux8Bit.sendInputTo(mux1, 0, 0);
    Mux8Bit.sendInputTo(mux2, 0, 0);
    Mux8Bit.sendInputTo(mux3, 0, 0);
    Mux8Bit.sendInputTo(mux4, 0, 0);
    Mux8Bit.sendInputTo(mux5, 0, 0);
    Mux8Bit.sendInputTo(mux6, 0, 0);
    Mux8Bit.sendInputTo(mux7, 0, 0);

	Mux8Bit.sendInputTo(wire0, 0, 1);
	Mux8Bit.sendInputTo(wire1, 0, 2);

	mux0.setInput(wire0, 0, 0);
	mux1.setInput(wire0, 1, 0);
	mux2.setInput(wire0, 2, 0);
	mux3.setInput(wire0, 3, 0);
	mux4.setInput(wire0, 4, 0);
	mux5.setInput(wire0, 5, 0);
	mux6.setInput(wire0, 6, 0);
	mux7.setInput(wire0, 7, 0);
	
	mux0.setInput(wire1, 0, 1);
	mux1.setInput(wire1, 1, 1);
	mux2.setInput(wire1, 2, 1);
	mux3.setInput(wire1, 3, 1);
	mux4.setInput(wire1, 4, 1);
	mux5.setInput(wire1, 5, 1);
	mux6.setInput(wire1, 6, 1);
	mux7.setInput(wire1, 7, 1);
	
	wire2.setInput(mux0, 0, 0);
	wire2.setInput(mux1, 0, 1);
	wire2.setInput(mux2, 0, 2);
	wire2.setInput(mux3, 0, 3);
	wire2.setInput(mux4, 0, 4);
	wire2.setInput(mux5, 0, 5);
	wire2.setInput(mux6, 0, 6);
	wire2.setInput(mux7, 0, 7);
	
	Mux8Bit.takeOutputFrom(wire2, 0, 0);
}

{
    var Demux = GateFactory("Demux", [1, 1], [1, 1]);
    const and0 = And();
    const and1 = And();
    const inv0 = Inv();
    and0.setInput(inv0, 0, 0);
    Demux.sendInputTo(inv0, 0, 0);
    Demux.sendInputTo(and0, 1, 1);
    Demux.sendInputTo(and1, 0, 0);
    Demux.sendInputTo(and1, 1, 1);
    Demux.takeOutputFrom(and0, 0, 0);
    Demux.takeOutputFrom(and1, 0, 1);
}

{
    var Latch = GateFactory("Latch", [1, 1], [1]);
    const mux0 = Mux();
    mux0.setInput(mux0, 0, 1);
    Latch.sendInputTo(mux0, 0, 0);
    Latch.sendInputTo(mux0, 2, 1);
    Latch.takeOutputFrom(mux0, 0, 0);
}

{
    var DFlipFlop = GateFactory("DFlipFlop", [1, 1, 1], [1]);
    const latch0 = Latch();
    const latch1 = Latch();
    const and0 = And();
    const inv0 = Inv();
    latch1.setInput(latch0, 0, 1);
    latch0.setInput(and0, 0, 0);
    and0.setInput(inv0, 0, 1);
    DFlipFlop.sendInputTo(and0, 0, 0);
    DFlipFlop.sendInputTo(latch0, 1, 1);
    DFlipFlop.sendInputTo(latch1, 0, 2);
    DFlipFlop.sendInputTo(inv0, 0, 2);
    DFlipFlop.takeOutputFrom(latch1, 0, 0);
}

{
    var Register8Bit = GateFactory("Register8Bit", [1, 8, 1], [8]);
	const wire0 = Wire(8, [8], [1, 1, 1, 1, 1, 1, 1, 1]);
	const wire1 = Wire(8, [1, 1, 1, 1, 1, 1, 1, 1], [8]);
    const dFlipFlop0 = DFlipFlop();
    const dFlipFlop1 = DFlipFlop();
    const dFlipFlop2 = DFlipFlop();
    const dFlipFlop3 = DFlipFlop();
    const dFlipFlop4 = DFlipFlop();
    const dFlipFlop5 = DFlipFlop();
    const dFlipFlop6 = DFlipFlop();
    const dFlipFlop7 = DFlipFlop();
	
	dFlipFlop0.setInput(wire0, 0, 1);
	dFlipFlop1.setInput(wire0, 1, 1);
	dFlipFlop2.setInput(wire0, 2, 1);
	dFlipFlop3.setInput(wire0, 3, 1);
	dFlipFlop4.setInput(wire0, 4, 1);
	dFlipFlop5.setInput(wire0, 5, 1);
	dFlipFlop6.setInput(wire0, 6, 1);
	dFlipFlop7.setInput(wire0, 7, 1);
	
	wire1.setInput(dFlipFlop0, 0, 0);
	wire1.setInput(dFlipFlop1, 0, 1);
	wire1.setInput(dFlipFlop2, 0, 2);
	wire1.setInput(dFlipFlop3, 0, 3);
	wire1.setInput(dFlipFlop4, 0, 4);
	wire1.setInput(dFlipFlop5, 0, 5);
	wire1.setInput(dFlipFlop6, 0, 6);
	wire1.setInput(dFlipFlop7, 0, 7);
	
	Register8Bit.sendInputTo(wire0, 0, 1);

    Register8Bit.sendInputTo(dFlipFlop0, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop1, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop2, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop3, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop4, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop5, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop6, 0, 0);
    Register8Bit.sendInputTo(dFlipFlop7, 0, 0);

    Register8Bit.sendInputTo(dFlipFlop0, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop1, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop2, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop3, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop4, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop5, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop6, 2, 2);
    Register8Bit.sendInputTo(dFlipFlop7, 2, 2);

	Register8Bit.takeOutputFrom(wire1, 0, 0);
}

{
    var Ram8Bit1a = GateFactory("Ram8Bit1a", [1, 1, 8, 1], [8]);
    const mux8Bit0 = Mux8Bit();
    const memCell0 = Register8Bit();
    const memCell1 = Register8Bit();
    const storeDemux = Demux();
    const clockDemux = Demux();
	
	mux8Bit0.setInput(memCell0, 0, 1);
	mux8Bit0.setInput(memCell1, 0, 2);

    memCell0.setInput(storeDemux, 0, 0);
    memCell1.setInput(storeDemux, 1, 0);
    memCell0.setInput(clockDemux, 0, 2);
    memCell1.setInput(clockDemux, 1, 2);

    Ram8Bit1a.sendInputTo(mux8Bit0, 0, 0);
    Ram8Bit1a.sendInputTo(storeDemux, 0, 0);
    Ram8Bit1a.sendInputTo(storeDemux, 1, 1);
    Ram8Bit1a.sendInputTo(clockDemux, 0, 0);
    Ram8Bit1a.sendInputTo(clockDemux, 1, 3);
	
	Ram8Bit1a.sendInputTo(memCell0, 1, 2);
	Ram8Bit1a.sendInputTo(memCell1, 1, 2);
	
	Ram8Bit1a.takeOutputFrom(mux8Bit0, 0, 0);
}

/*var nand0 = Nand();
var toggleable0 = toggleable();
var toggleable1 = toggleable();
nand0.setInput(toggleable0, 0, 0);
nand0.setInput(toggleable1, 0, 1);*/

/*var mux0 = Mux();
var toggle0 = Toggle();
var toggle1 = Toggle();
mux0.setInput(toggle0, 0, 0);
mux0.setInput(mux0, 0, 1);
mux0.setInput(toggle1, 0, 2);*/

var latch0 = Latch();
var toggle0 = Toggle();
var toggle1 = Toggle();
latch0.setInput(toggle0, 0, 0);
latch0.setInput(toggle1, 0, 1);

latch0.addEventListener("replaced", function(e) {
	console.log(e.parent.uid, "was replaced by", e.replacement.uid);
});

var Test = AtomicGateFactory("Test", [Infinity], [Infinity], `return inputs`);
var test0 = Test();

test0.addEventListener("replaced", function(e) {
	console.log(e.parent.uid, "was replaced by", e.replacement.uid);
});

blog = true
test0.blogOutputs();
Test.setOutputSizes([Infinity, 1]);
Test.setCalculatorBody(`return [inputs[0], [1]]`);
test0 = test0.replacedBy();
test0.blogOutputs();
test0.calculate();
test0.blogOutputs();

/*blog = true;
toggle0.toggle();
toggle0.propagate();
toggle1.toggle();
toggle1.propagate();
toggle0.toggle();
toggle0.propagate();
toggle1.toggle();
toggle1.propagate();*/

/*var nand0 = Nand();
var nand1 = Nand();
var nand2 = Nand();
var nand3 = Nand();
var toggle0 = Toggle();
var toggle1 = Toggle();
nand0.setInput(toggle0, 0, 0);
nand0.setInput(toggle0, 0, 1);
nand1.setInput(nand0, 0, 0);
nand1.setInput(nand3, 0, 1);
nand2.setInput(toggle0, 0, 0);
nand2.setInput(toggle1, 0, 1);
nand3.setInput(nand1, 0, 0);
nand3.setInput(nand2, 0, 1);

var map = Gate.generateStructureMap([toggle0, toggle1]);
Gate.propagate([toggle0, toggle1], map);

blog = true;

toggle0.toggle();
Gate.propagate([toggle0, toggle1], map);
toggle1.toggle();
Gate.propagate([toggle0, toggle1], map);
toggle0.toggle();
Gate.propagate([toggle0, toggle1], map);*/

//var ram8Bit1a0 = Ram8Bit1a();