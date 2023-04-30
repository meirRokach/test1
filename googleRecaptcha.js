(function(){const{$A}=window;return {
  "meta":{
    "name":"c$googleRecaptcha",
    "extends":"markup://aura:component"
  },
  "controller":{
    "doInit":function(cmp, evt, helper) {

        
        if (cmp.get("v.requiredOnce") === false) {
            cmp.set("v.isHuman", true);
        }

        
        var allowedURLs = [];

        if (cmp.get("v.originPageURL") != null) {
            var originPageURL = cmp.get("v.originPageURL");
            allowedURLs = originPageURL
                .split(",")
                .map(function(item) {
                    return item.trim();
                });
        }

        
        helper.sendRequest(cmp, 'c.fetchBaseURL', {})
            .then($A.getCallback(function(records) {
                cmp.set("v.allowedURLs", allowedURLs.concat(records));
            }))
            .catch(function(errors) {
                console.error(`ERROR: ${errors}`);
            });

        
        cmp.set('v.validate', function() {

            let errorMessage = "Please complete the captcha";

            if (cmp.get("v.requiredMessage")) {
                errorMessage = cmp.get("v.requiredMessage");
            }

            if (cmp.get("v.required") && !cmp.get("v.isHuman")) {
                return { isValid: false, errorMessage: errorMessage};
            }

            return { isValid: true };
        })

        
        window.addEventListener("message", function(event) {

            
            var hasDomain = false;
            var listAllowedURLs = cmp.get("v.allowedURLs");

            if (listAllowedURLs === undefined || listAllowedURLs.length == 0) {
                return;
            }

            for (let i = 0; i < listAllowedURLs.length; i++) {
                if (listAllowedURLs[i] == event.origin) {
                    hasDomain = true;
                }
            }

            if (!hasDomain) {
                return;
            }

            
            var eventName = event.data[0];
            var data = event.data[1];

            
            

            if (eventName==="setHeight") {
                cmp.find("captchaFrame").getElement().height = data;
            }
            if (eventName==="setWidth") {
                cmp.find("captchaFrame").getElement().width = data;
            }
            if (eventName==="Lock") {
                cmp.set("v.isHuman", false);
            }
            if (eventName==="Unlock") {
                if (cmp.get("v.enableServerSideVerification")) {
                    cmp.set("v.recaptchaResponse", data);

                    
                    var params = {"recaptchaResponse" : cmp.get("v.recaptchaResponse"), "recaptchaSecretKey" : cmp.get("v.secretKey")};
                    helper.sendRequest(cmp, 'c.isVerified', params)
                    .then($A.getCallback(function(records) {
                        
                        if (records === true) {

                            
                            if (cmp.get("v.requiredOnce") === true) {
                                window.setTimeout(
                                    $A.getCallback(function() {
                                        cmp.set("v.isHuman", true);
                                    }), 500
                                );
                            } else {
                                
                                cmp.set("v.isHuman", true);
                            }

                        }
                    }))
                    .catch(function(errors) {
                        console.error(`ERROR: ${errors}`); 
                    });

                } else {
                    cmp.set("v.isHuman", true);
                }
            }

        }, false);
    }
  },
  "helper":{
    "sendRequest":function(cmp, methodName, params) {
        return new Promise($A.getCallback(function (resolve, reject) {
            var action = cmp.get(methodName);
            action.setParams(params);
            action.setCallback(self, function (res) {
                var state = res.getState();
                if (state === 'SUCCESS') {
                    resolve(res.getReturnValue());
                } else if (state === 'ERROR') {
                    reject(action.getError())
                }
            });
            $A.enqueueAction(action);
        }));
    }
  }
};

}())
//# sourceURL=https://cacms.state.gov/s/components/c/googleRecaptcha.js