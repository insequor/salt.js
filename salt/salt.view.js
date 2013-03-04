/*
Ozgur Yuksel, July, 2012
    
*/
define(['salt/salt.base', 'salt/salt.event', 'salt/salt.model'], function(salt) {
    //Find all elements which has an attribute named ml, it goes down in the tree
    //but stops once it finds an ml attribute. This way children of each found element 
    //is handled when their parent gets a viewer
    function findSaltyElement(parent, elements) {
        var root = $(parent);
        if (root.attr('salt'))
            elements.push(root);
        else {
            $.each(root.children(), function(idx, child) {
                findSaltyElement(child, elements);
            });
        }
    }

    //
    //Followign three String extensions (format, endsWith and startsWith) are from
    // http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery
    String.format = function() {
        var s = arguments[0];
        for (var i = 0; i < arguments.length - 1; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            s = s.replace(reg, arguments[i + 1]);
        }

        return s;
    }

    String.prototype.endsWith = function(suffix) {
        return (this.substr(this.length - suffix.length) === suffix);
    }

    String.prototype.startsWith = function(prefix) {
        return (this.substr(0, prefix.length) === prefix);
    }

    //
    //
    //
    String.prototype.replaceAll = function(str1, str2, ignore) {
        return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
    }

    //
    //This is adapted from: http://stackoverflow.com/questions/3354224/javascript-regex-how-to-get-text-between-curly-
    //use double length characters for start and end to avoid limiting usage of certain characters in the text
    //for example using { will limit the user but having {{ is better. You can even use __ for both start and end
    //which results __key__ like usage which might be easier to read
    function getTemplateParameters(template, start, end) {
        if (!start)
            start = '{{';
        if (!end)
            end = '}}';

        var results = {}

        //TODO: This requler expression is simple looking but I don't really get it, we repeat the
        //end identifier in the middle to make sure that it will stop matching as soon as it finds the
        //end identifier.
        var restr = String.format('/{0}([^{1}]+){1}/g', start, end);
        var re = eval(restr); //   /{([^}]+)}/g;
        var text;
        while (text = re.exec(template)) {
            var param = start + text[1] + end;
            if (results[param])
                continue;
            var func = new Function('record', String.format('return {0};', text[1]));
            results[param] = func;
        }
        return results;
    }



    salt.view = {
        //return a list of elements which has the salt attribute in them
        //this list contains only the top level elements starting from the given parent
        //if no element found it will return an empty list
        saltyElements: function(parent) {
            if (!parent)
                return [];

            var elements = [];
            var root = $(parent);
            findSaltyElement(root, elements);
            return elements;
        }

        , config: function(attr) {
            if (!attr)
                return {};
            var config = {};
            $.each(attr.split(';'), function(pairIdx, pair) {
                pair = pair.split(':');
                config[pair[0]] = pair[1];
            });
            return config;
        }

        //TODO: This method uses fixed start and end identifiers as { and } 
        //It does not support character escaping like use {{ to mean {
        , template: function(text, start, end) {
            var tmpl = { id: undefined, text: text, params: {} };
            tmpl.params = getTemplateParameters(text, start, end);
            return tmpl;
        }

        , evaluate: function(template, record) {
            var text = template.text;
            $.each(template.params, function(key, val) {
                try {
                    text = text.replaceAll(key, val(record));
                }
                catch (err) {
                    console.log('Exception caught while evaluating: ' + key);
                    console.log(record);
                    console.log(err);
                }
            });

            return text;
        }
    };

    /*View object manages the DOM element its responsibilities are:
    * Create the template
    * Create/Update the element when necessary
    * Provide the data connection
    
    View is configured with passing a doc element or jquery selector, or a string
    Configuration of view is two fold:
    * element text is used to constuct a template object: it requires at least one 
    template parameter is used
    * salt attribute is used to construct a cofig object: Each view object is free to 
    define its own config parameters but for a predictable usage it is expected that 
    derived viewers supports the config parameters from base objects
    
    Supported config parameters:
    * source: source object to connect to, it has to be a global object (window.) at this
    point
    *
    */
    salt.View = function(element) {

        element = $(element);

        this.config = salt.view.config(element.attr('salt'));
        //as soon as we have the attribute we can remove it from the element
        //this is mainly required if we have start and end identifiers defined
        //in the config. It sees them as keywords and tries to replace.
        element.removeAttr('salt');
        
        this.element = element[0];
        if (this.element) {
            var tmpl = salt.view.template(this.element.outerHTML, this.config.start, this.config.end);
            if (!salt.isEmpty(tmpl.params))
                this.template = tmpl;
        }

        if ('source' in this.config)
            this.source = eval(this.config.source);

        if (this.template && this.element) {
            var temp = salt.view.evaluate(this.template, this.source);
            temp = $(temp);
            var thisElement = $(this.element);
            thisElement.html(temp.html());
            var attributes = temp[0].attributes;
            $.each(attributes, function(idx, attr) {
                try {
                    thisElement.attr(attr.name, attr.value);
                }
                catch (err) {
                    console.log(err);
                }
            });
            temp.remove();
        }
    };



    return salt;
});
