/**
 * @NScriptName firstshift | SS | Entity Sync
 * @NScriptId customscript_ss_fs_sync_entities
 * @author eli@crowe
 * @filename firstshift_ss_entities.js
 * @description Scheduled script to sync vendor/source, customer, location and product to firstshift.ai
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../SuiteScripts/firstshift_config.json
 *
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2023     eli@crowe        Initial version
 *
 */

define(['common', 'N/record', 'N/runtime', 'N/url', 'N/https', 'N/search'],

   function(FS, record, runtime, url, https, search) {

      var GLOBAL_CONSTANT = FS.GLOBAL_CONSTANT();

      function execute() {
         try {
            var arr = getSyncData(GLOBAL_CONSTANT);
            log.debug('arr', JSON.stringify(arr));
         }
         catch(ex){
            log.error('ERROR: firstshift | SS | Entity Sync', JSON.stringify(ex));
         }
      }

      //region FUNCTIONS

      function getSyncData(GLOBAL_CONSTANT){

         var arr = [];
         var searchVendor = GLOBAL_CONSTANT.SEARCH.VENDOR;
         var searchVendorObj = search.load({
            type: record.Type.VENDOR,
            id: searchVendor
         });
         var resultSet = searchVendorObj.run();
         var currentRange = resultSet.getRange({
            start : 0,
            end : 1000
         });

         var i = 0;  // iterator for all search results
         var j = 0;  // iterator for current result range 0..999

         var line = parseInt(0);

         while ( j < currentRange.length ) {

            var result = currentRange[j];
            var id = result.id;
            var column = result.columns;

            arr.push({
               id : id
            });
            line++;
            i++;
            j++;
            if( j==1000 ) {   // check if it reaches 1000
               j=0;          // reset j an reload the next portion
               currentRange = resultSet.getRange({
                  start : i,
                  end : i + 1000
               });
            }

         }
         return arr;

      }

      //endregion FUNCTIONS

      //region COMMON FUNCTIONS

      function isEmpty(stValue) {
         return ((stValue === '' || stValue == null || stValue == undefined) ||
            (stValue.constructor === Array && stValue.length == 0) ||
            (stValue.constructor === Object && (function(v) {
               for (var k in v) return false;
               return true;
            })(stValue)));
      }
      //endregion COMMON FUNCTIONS

      //region LIST
      //endregion LIST

      return {
         execute: execute
      }
   }
);
