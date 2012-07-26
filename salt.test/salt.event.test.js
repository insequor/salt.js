
require(['salt.event'], function(salt, undefined) {
    test("object is not undefined", function() {
        notEqual(salt.event, undefined, "should not be undefined");
    });
    test("bind adds the method in the list", function() {
        var src = {};
        var method = function() { };
        salt.event.bind({ source: src, event: 'event', method: method });
        equal(src.salt.listeners['event'].length, 1);
        equal(src.salt.listeners['event'][0], method);

        salt.event.bind({source: src, event: 'event', method: function() { } });
        equal(src.salt.listeners['event'].length, 2);
    });
    test("binded method receives the event", function() {
        var src = {};
        var methodCalled = false;
        var method = function() { methodCalled = true; };
        salt.event.bind({ source: src, event: 'event', method: method });

        //check that method is called
        salt.event.trigger(src, 'event');
        equal(methodCalled, true, 'method should have been called');
    });

    test("unbind all clears the listeners", function() {
        var src = {};
        var method1 = function() { };
        var method2 = function() { };
        salt.event.bind({ source: src, event: 'event', method: method1 });
        salt.event.bind({ source: src, event: 'event', method: method2 });
        equal(src.salt.listeners['event'].length, 2);
        salt.event.unbind(src, 'event');
        equal(src.salt.listeners['event'].length, 0);
    });

    test("unbind single method removes only the selected method", function() {
        var src = {};
        var method1 = function() { };
        var method2 = function() { };
        salt.event.bind({ source: src, event: 'event', method: method1 });
        salt.event.bind({ source: src, event: 'event', method: method2 });
        equal(src.salt.listeners['event'].length, 2);
        salt.event.unbind(src, 'event', method1);
        equal(src.salt.listeners['event'].length, 1);
        equal(src.salt.listeners['event'][0], method2);
    });
});

