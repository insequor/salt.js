
require(['salt.view'], function(salt, undefined) {
    test("salt.view object is not undefined", function() {
        notEqual(salt.view, undefined, "should not be undefined");
    });

    //saltyElements
    test("saltyElements returns empty list for no parent", function() {
        equal(salt.view.saltyElements().length, 0);
    });

    test("saltyElements returns empty list if string does not have salty element", function() {
        var el = '<div>some text</div>';
        equal(salt.view.saltyElements(el).length, 0);
    });

    test("saltyElements returns the given element if it is salty", function() {
        var el = '<div salt="salt attribute">salty element</div>';
        var elements = salt.view.saltyElements(el);
        equal(elements.length, 1);
        equal(elements[0].html(), 'salty element');
    });

    test("saltyElements returns the salty children", function() {
        var el = '<div><div>not salty child</div><div salt="salt attribute">salty child</div></div>';
        var elements = salt.view.saltyElements(el);
        equal(elements.length, 1);
        equal(elements[0].html(), 'salty child');
    });

    test("saltyElements ignores the salty children if parent is salty", function() {
        var el = '<div salt="salt"><div>not salty child</div><div salt="salt attribute">salty child</div></div>';
        var elements = salt.view.saltyElements(el);
        equal(elements.length, 1);
        equal(elements[0].children().length, 2);
    });


    //config
    test("config parses given value key pairs", function() {
        var attr = 'key1:value1;keyWithoutValue;';
        var config = salt.view.config(attr);
        equal(config.key1, 'value1');
        equal('keyWithoutValue' in config, true);
        equal(config.keyWithoutValue, undefined);
    });

});

