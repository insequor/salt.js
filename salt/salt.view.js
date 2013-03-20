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
            var func = new Function('record', 'view', String.format('return {0};', text[1]));
            results[param] = func;
        }
        return results;
    }


    salt.initialize_view = function(document){
        $.each(salt.view.saltyElements(document), function(idx, element) {
            salt.create_view(element);
        });
    };
    
    salt.create_view = function(element, source){
        var config = salt.view.config(element.attr('salt'));
        
        
        if('ref' in config)
        {
            //In case of referenced view we copy the given config on top of the referenced config. This 
            //way view can override some configuration which was given in template. It is useful if you
            //want to use the same view with different data sources for example
            try {
                var tmpl = salt.view.cached_templates[config.ref];
                
                var newElement = $(tmpl.text);
                newElement.insertAfter(element);
                element.remove();
                element = newElement;
                element.id = undefined;
                
                var templateConfig = salt.view.config(element.attr('salt'));
                for(var key in config)
                    templateConfig[key] = config[key];
                
                config = templateConfig;
            }
            catch(e){
                console.log(e);
            };
        }
        
        var view = 'View';
        if('view' in config)
            view = config['view'];
        
        if ((!source) && ('source' in config))
            source = eval(config.source);
            
        view = salt.views[view];
        
        view = new view();
        view.init(element, config, source);
        return view;
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

        , cached_templates : {}
        
        //TODO: This method uses fixed start and end identifiers as { and } 
        //It does not support character escaping like use {{ to mean {
        , template: function(element, start, end) {
            var tmpl = {id: element.id, text: element.outerHTML, params: {} };
            tmpl.params = getTemplateParameters(tmpl.text, start, end);
            if(tmpl.id)
            {
                salt.view.cached_templates[tmpl.id] = tmpl;
            }
            else {
                var config = salt.view.config($(element).attr('salt'));
                if(config && 'ref' in config)
                {
                    try {
                        tmpl = salt.view.cached_templates[config.ref];
                    }
                    catch(e){
                        console.log(e);
                    }
                    if(!tmpl)
                        console.log('Could not find the cached template: "' + config.ref + '" it is possible that it is not available yet');
                }
            }
            
            return tmpl;
        }
        
        //return a list of templates each created for one child of the given parent element
        , templates: function(parent, start, end) {
            var templates = {};
            $.each($(parent).children(), function(idx, element) {
                var tmpl = salt.view.template(element, start, end);
                //We register first found template as the default one so it will be used
                //if config does not contain a template value
                if(!templates[undefined])
                    templates[undefined] = tmpl;
                templates[tmpl.id] = tmpl;
            });
            return templates;
            
        }
        

        , evaluate: function(template, record, view) {
            var text = template.text;
            $.each(template.params, function(key, val) {
                try {
                    text = text.replaceAll(key, val(record, view));
                }
                catch (err) {
                    console.log('Exception caught while evaluating: ' + key);
                    console.log(record);
                    console.log(view);
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
    salt.View = function() {};
    
    salt.View.prototype.init = function(element, config, source){
        if(!element || !config)
            return;
            
        var _this = this;
        
        element = $(element);

        this.config = config;
        //as soon as we have the attribute we can remove it from the element
        //this is mainly required if we have start and end identifiers defined
        //in the config. It sees them as keywords and tries to replace.
        //element.removeAttr('salt');
        
        this.element = element[0];
        
        //TODO: This is probably not a very good idea'
        this.element._salt_view = this;
        
        if (this.element) {
            var tmpl = salt.view.template(this.element, this.config.start, this.config.end);
            if (!salt.isEmpty(tmpl.params))
                this.template = tmpl;
        }
        
        this.source = source;
        
        if (this.source){
            if(this.source.bind) {
                this.source.bind({
                    event: 'changed'
                    , method: function(val) {_this.render();} 
                    , trigger: false
                });
            }    
        }
        this.render();
        
        
    
    };

    salt.View.prototype.render = function (){
        if (this.template && this.element) {
            var temp = salt.view.evaluate(this.template, this.source, this);
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
    
    salt.ListView = function(){}
    salt.inherit(salt.ListView, salt.View);
    
    //List view does not render to keep the content coming from array elements, they are handled
    // thrhough push and remove handlers
    salt.ListView.prototype.render = function (){};
    
    
    salt.ListView.prototype.init = function(element, config, source){
        salt.View.prototype.init.call(this, element, config, source);
        
        var _this = this;
        
        if('filter' in config)
            this.filter = eval(config.filter);
            
        this.templates = salt.view.templates(element, config.start, config.end);
        
        //We are done with the template processing so we can get rid of them
        //We will populate our own list. This would create trouble if we want to 
        //have static elements (not per record) but that's not the case at the moment
        $(element).html('');
        
        if (this.source){
            if(this.source.bind) {
                this.source.bind({
                    event: 'added'
                    , method: function(val) {_this.push_handler(val);} 
                    , trigger: true
                });
                this.source.bind({
                    event: 'removed'
                    , method: function(val) {_this.remove_handler(val);} 
                    , trigger: true
                });
            }
            else 
                this.render();
        }
    }
    
    salt.ListView.prototype.push_handler = function(record) {
        if(this.filter && !this.filter(record))
            return;
            
        //var newElement = $(evaluateTemplate(template.html, template.params, item));
        //We do not evaluate the template since the create Pane will do it and it will also 
        //keep a reference to the tenplate and it needs the parametric version
        //TODO: Support selecting a template based on record
        //var template = _this.template(item);
        var template = this.templates[undefined];
        var newElement = $(template.text);
        $(this.element).append(newElement);
        
        if (newElement.attr('salt'))
            salt.create_view(newElement, record);
        else {
            //TODO: ?
            //$.each(mlElements(newElement), function(childIdx, child) {
            //    createViewer(child, item);
            //});
        }
    }
    
    salt.ListView.prototype.remove_handler = function(record) {
        //TODO: WE should make sure that bindings are removed properly
        //And there should be a better way of finding the view directly 
        //without looping all, but I don't want to modify the record...
        $.each($(this.element).children(), function(idx, child) {
            var view = child._salt_view;
            if(view && view.source == record)
                $(child).remove();
        });
        
    }
    
    
    
    //this is the list of views added by the extensions. Normally we use evaluate call but with the 
    //requirejs usage I am not sure how we can make those names available everywhere... With this way 
    //user can also override the default views
    salt.views = {
        'View': salt.View
        , 'ListView': salt.ListView
    };
    
    
    
    return salt;
});
