
require(['salt.model'], function(salt, undefined) {
    test("salt.model object is not undefined", function() {
        notEqual(salt.model, undefined, "should not be undefined");
    });

    //update
    test("new values are added into the source", function() {
        source = {};
        target = { a: 5 };
        var res = salt.model.update(source, target);
        equal(res[0], true);
        equal(res[1], true);
        equal(source.a, target.a);
    });

    test("existing values are updated", function() {
        source = { a: 2 };
        target = { a: 5 };
        var res = salt.model.update(source, target);
        equal(res[0], true);
        equal(res[1], false);
        equal(source.a, target.a);
    });

    test("nothing changed if values are identical", function() {
        source = { a: 5 };
        target = { a: 5 };
        var res = salt.model.update(source, target);
        equal(res[0], false);
        equal(res[1], false);
        equal(source.a, target.a);
    });

    //DATA OBJECT
    test("instantiate a Data object", function() {
        var source = new salt.Data({ a: 5 });
        equal(source.a, 5);
    });

    test("update Data object", function() {
        var source = new salt.Data({ a: 5 });
        source.update({ a: 7 });
        equal(source.a, 7);
    });

    test("bind changed event and see that it is called automatically", function() {
        var source = new salt.Data({ a: 5 });
        var receivedValue1;
        function method1(value) { receivedValue1 = value; };
        var receivedValue2;
        function method2(value) { receivedValue2 = value; };

        source.bind({ event: 'changed', method: method2, trigger: false });
        source.bind({ event: 'changed', method: method1, trigger: true });
        equal(receivedValue1, source);
        equal(receivedValue2, undefined);
    });

    test("changed event is sent when data is modified", function() {
        var source = new salt.Data({ a: 5 });
        var receivedValue;
        function method(value) { receivedValue = value; };

        source.bind({ event: 'changed', method: method, trigger: false });
        equal(receivedValue, undefined);
        source.update({ a: 7 });
        equal(receivedValue, source);

    });

    //push
    test("pushing an array causes both push and changed on the array", function() {
        source = [];
        var res = salt.model.push(source, 5);
        equal(res[0], true);
        equal(res[1], true);
        equal(source[0], 5);
    });

    //remove
    test("remove first element in the array", function() {
        source = [3, 5, 7, 8];
        var res = salt.model.remove(source, 3);
        equal(res[0], true);
        equal(res[1], true);
        equal(source[0], 5);
        equal(source.length, 3);
    });

    test("remove last element in the array", function() {
        source = [3, 5, 7, 8];
        var res = salt.model.remove(source, 8);
        equal(res[0], true);
        equal(res[1], true);
        equal(source[2], 7);
        equal(source.length, 3);
    });

    test("remove middle element in the array", function() {
        source = [3, 5, 7, 8];
        var res = salt.model.remove(source, 5);
        equal(res[0], true);
        equal(res[1], true);
        equal(source[1], 7);
        equal(source.length, 3);
    });

    test("push event is sent when new item is added", function() {
        var source = [];
        var pushValue;
        var methodPush = function(value) {
            pushValue = value;
        };
        salt.event.bind({ source: source, event: 'push', method: methodPush });
        salt.model.push(source, 7);
        equal(pushValue, 7, 'push method should have been called');
    });

    test("remove event is sent when an item is removed", function() {
        var source = [3, 5, 7, 9];
        var removeValue;
        var methodRemove = function(value) {
            removeValue = value;
        };
        var changeValue;
        var methodChange = function(value) {
            changeValue = value;
        };

        salt.event.bind({ source: source, event: 'remove', method: methodRemove });
        salt.model.remove(source, 7);
        equal(removeValue, 7, 'remove method should have been called');
    });


    //ARRAY OBJECT
    test("instantiate an Array object", function() {
        var source = new salt.Array([3, 5]);
        equal(source[0], 3);
        equal(source[1], 5);
        equal(source.length, 2);
    });

    test("bind the added event and see that it is called automatically", function() {
        var source = new salt.Array([3, 5]);
        var receivedValue1 = [];
        function method1(value) { receivedValue1.push(value); };
        var receivedValue2 = [];
        function method2(value) { receivedValue2.push(value); };

        source.bind({ event: 'added', method: method2, trigger: false });
        source.bind({ event: 'added', method: method1, trigger: true });
        equal(receivedValue1.length, 2);
        equal(receivedValue1[0], source[0]);
        equal(receivedValue1[1], source[1]);
        equal(receivedValue2.length, 0);
    });

    test("added event is called for pushed items", function() {
        var source = new salt.Array([3, 5]);
        var receivedValue;
        function method(value) { receivedValue = value; };
        source.bind({ event: 'added', method: method, trigger: false });
        equal(receivedValue, undefined);
        source.push(7);
        equal(receivedValue, 7);
        equal(source.length, 3);
        equal(source[2], receivedValue);
    });

    test("removed event is called for pushed items", function() {
        var source = new salt.Array([3, 5, 7, 9]);
        var receivedValue;
        function method(value) { receivedValue = value; };
        source.bind({ event: 'removed', method: method, trigger: false });
        equal(receivedValue, undefined);
        source.remove(7);
        equal(receivedValue, 7);
        equal(source.length, 3);
        equal(source[2], 9);
    });

    test("changed items trigger changed event on the array", function() {
        var item = new salt.Data();
        var source = new salt.Array([item]);

        var receivedValue;
        function method(value) { receivedValue = value; };
        source.bind({ event: 'changed', method: method, trigger: false });
        equal(receivedValue, undefined);

        item.update({ a: 4 });

        equal(receivedValue, source);
    });


    test("removed items do not trigger changed event on the array any more", function() {
        var item1 = new salt.Data();
        var item2 = new salt.Data();
        var source = new salt.Array([item1, item2]);

        var receivedValue;
        function method(value) { receivedValue = value; };
        source.bind({ event: 'changed', method: method, trigger: false });
        equal(receivedValue, undefined);

        source.remove(item1);
        equal(source.length, 1);
        
        item1.update({ a: 4 });

        equal(receivedValue, undefined);
    });



});

