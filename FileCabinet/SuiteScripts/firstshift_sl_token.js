/**
 * @NScriptName firstshift | SL | Token
 * @NScriptId customscript_sl_fs_token
 * @author eli@crowe
 * @filename firstshift_sl_token.js
 * @description Generate a Token for firstshift.ai API calls
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=3903
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2022     eli@crowe        Initial version
 *
 */

define(['N/runtime', 'N/https'],

   function(runtime, https) {

      var runTimeContext = runtime.getCurrentScript();

      var paramBaseUri = runTimeContext.getParameter({name : 'custscript_fs_base_uri'});
      var paramUrlToken = runTimeContext.getParameter({name : 'custscript_fs_url_getapitoken'});
      var paramUsername = runTimeContext.getParameter({name : 'custscript_fs_username'});
      var paramPassword = runTimeContext.getParameter({name : 'custscript_fs_password'});

      var GLOBAL_CONSTANT = {
         ENDPOINT : {
            URI : paramBaseUri,
            TOKEN : paramUrlToken
         },
         CREDENTIALS : {
            USERNAME : paramUsername,
            PASSWORD : paramPassword
         }
      };

      function onRequest(context) {

         try{

            if(isEmpty(GLOBAL_CONSTANT.ENDPOINT.URI) ||
               isEmpty(GLOBAL_CONSTANT.ENDPOINT.TOKEN) ||
               isEmpty(GLOBAL_CONSTANT.CREDENTIALS.USERNAME) ||
               isEmpty(GLOBAL_CONSTANT.CREDENTIALS.PASSWORD)
            ){
               return;
            }

            var endpoint = GLOBAL_CONSTANT.ENDPOINT.URI + GLOBAL_CONSTANT.ENDPOINT.TOKEN;

            var headers = new Object();
            headers['Content-Type'] = 'application/json;charset=utf-8';
            headers['Accept'] = 'application/json';
            headers['User-Agent-x'] = 'SuiteScript-Call';

            var payload = {
               "userName": GLOBAL_CONSTANT.CREDENTIALS.USERNAME,
               "password": GLOBAL_CONSTANT.CREDENTIALS.PASSWORD
            };

            var response = https.post({
               url: endpoint,
               headers: headers,
               body : JSON.stringify(payload)
            });

            var strResponseBody = '';
            var strResponseCode = response.code;
            if (strResponseCode == 200 || strResponseCode == 201) {
               strResponseBody = response.body;
            }
            else{
               strResponseBody = false;
            }
            context.response.write({output: strResponseBody});
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      function isEmpty(stValue) {
         return ((stValue === '' || stValue == null || stValue == undefined) ||
            (stValue.constructor === Array && stValue.length == 0) ||
            (stValue.constructor === Object && (function(v) {
               for (var k in v) return false;
               return true;
            })(stValue)));
      }

      return {
         onRequest: onRequest
      };
   });