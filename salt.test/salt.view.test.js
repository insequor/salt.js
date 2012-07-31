
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

    //template
    test("template returns default object for empty text", function() {
        var tmpl = salt.view.template('');
        equal(tmpl.text, '');
        deepEqual(tmpl.params, {});
    });

    test("template replaces keys with params", function() {
        var text = 'this is some text with key {5} which should evaluate to 5 ';
        var tmpl = salt.view.template(text);
        equal(tmpl.text, text);
        notEqual(tmpl.params['{5}'], undefined);
    });

    test("template ignores the start without end", function() {
        var text = 'text with {key without end';
        var tmpl = salt.view.template(text);
        equal(tmpl.text, text);
        deepEqual(tmpl.params, {});
    });

    test("template ignores the end without start", function() {
        var text = 'text with }key without start';
        var tmpl = salt.view.template(text);
        equal(tmpl.text, text);
        deepEqual(tmpl.params, {});
    });

    /*TODO
    test("template ignores the double start", function() {
    var text = 'text with double {{0}';
    var tmpl = salt.view.template(text);
    equal(tmpl.text, text);
    deepEqual(tmpl.params, {});
    });
    */

    //evaluate
    test("evaluate replaces constant values", function() {
        var tmpl = salt.view.template('test {5} five');
        var text = salt.view.evaluate(tmpl);
        equal(text, 'test 5 five');
    });

    test("evaluate replaces values from record", function() {
        var me = { name: 'ozgur', age: 35 };
        var tmpl = salt.view.template('hey, {record.name} was here');
        var text = salt.view.evaluate(tmpl, me);
        equal(text, 'hey, ozgur was here');
    });

    test("evaluate replaces method calls from record", function() {
        var me = { name: function() { return 'ozgur'; }, age: 35 };
        var tmpl = salt.view.template('hey, {record.name()} was here');
        var text = salt.view.evaluate(tmpl, me);
        equal(text, 'hey, ozgur was here');
    });

    test("evaluate replaces method calls with parameters from record", function() {
        var me = { name: function(a) { return 'ozgur' + a; }, age: 35 };
        var tmpl = salt.view.template('hey, {record.name(" was")} here');
        var text = salt.view.evaluate(tmpl, me);
        equal(text, 'hey, ozgur was here');
    });

    //View object
    test("View object can be instantiated", function() {
        var view = new salt.view.View();
        deepEqual(view.element, undefined);
        deepEqual(view.source, undefined);
        deepEqual(view.template, undefined);
    });

    test("View object does not modify a normal element", function() {
        var text = '<div>this is a normal div element</div>';
        var view = new salt.view.View(text);
        deepEqual(view.element.outerHTML, text);
        deepEqual(view.source, undefined);
        deepEqual(view.template, undefined);
    });

    test("View object constructs the template if there is at least one template value", function() {
        var text = '<div>Name = {"ozgur"}</div>';
        var view = new salt.view.View(text);
        deepEqual(view.template.text, text);
        deepEqual(salt.isEmpty(view.template.params), false);
    });

    test("View object gets the given source from salt attribute", function() {
        var text = '<div salt="source:25">some element</div>';
        var view = new salt.view.View(text);
        deepEqual(view.element.outerHTML, text);
        deepEqual(view.source, 25);
    });

    test("View refreshes it's body evaluating the template", function() {
        var text = '<div salt="source:25" foo="{3}">some element {record}</div>';
        var view = new salt.view.View(text);
        deepEqual(view.element.outerHTML, '<div salt="source:25" foo="3">some element 25</div>');
    });

    //TODO: Test the case where there are two cild nodes under one parent which uses source from
    //parent... In old version we added a check saying a node should not be updated if it contains
    //parametric child nodes since it will re-create the child nodes. We can probably extend this check
    //and either allow update of attributes or support re-creating child nodes.







});

