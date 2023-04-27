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
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=3911
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

            var runTimeContext = runtime.getCurrentScript();
            var paramSyncVendor = runTimeContext.getParameter({name : 'custscript_fs_sync_vendor'});
            var paramSyncCustomer = runTimeContext.getParameter({name : 'custscript_fs_sync_customer'});
            var paramSyncLocation = runTimeContext.getParameter({name : 'custscript_fs_sync_location'});
            var paramSyncProduct = runTimeContext.getParameter({name : 'custscript_fs_sync_item'});

            if(paramSyncVendor) {
               syncVendor();
            }

            if(paramSyncCustomer) {
               syncCustomer();
            }

            if(paramSyncLocation) {
               syncLocation();
            }

            if(paramSyncProduct) {
               syncProduct();
            }

         }
         catch(ex){
            log.error('ERROR: firstshift | SS | Entity Sync', JSON.stringify(ex));
         }
      }

      //region FUNCTIONS

      //region PRODUCT

      function syncProduct(){

         var arr = getSyncProductData(GLOBAL_CONSTANT);
         log.debug('arr', JSON.stringify(arr));

         var arrMappings = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER);
         log.debug('arrMappings', JSON.stringify(arrMappings));

         var payload = {};
         var payloadEntityName = {};
         var arrRowData = [];

         if (!FS.isEmpty(arrMappings)) {

            for (var v in arr) {

               var rowData = {};
               var newRecord = record.load({
                  type: record.Type.INVENTORY_ITEM,
                  id: arr[v].id
               });

               for (var i in arrMappings) {
                  var netSuiteId = arrMappings[i].netsuite_id;
                  var firstShiftId = arrMappings[i].firstshift_id;
                  var tempValue = newRecord.getText({fieldId: netSuiteId.toString()});
                  if (FS.isEmpty(tempValue)) {
                     tempValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                  }
                  if (!FS.isEmpty(tempValue)) {
                     rowData[firstShiftId] = tempValue.toString();
                  }
               }
               arrRowData.push(rowData);
            }

            arrRowData.push(rowData);
            payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER;
            payload.ENTITY_META_DATA = payloadEntityName;
            payload.rowData = arrRowData;

            log.debug('rowData', JSON.stringify(payload));

            if (!FS.isEmpty(arrRowData)) {

               var tokenResponse = FS.getTokenResponse();
               var tenantId = FS.getTenantId(tokenResponse);
               var accesstoken = FS.getToken(tokenResponse);

               log.debug('accesstoken: ' + accesstoken, JSON.stringify(payload));

               if (FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)) {
                  return;
               }

               var headers = new Object();
               headers['Content-Type'] = 'application/json;charset=utf-8';
               headers['Accept'] = 'application/json';
               headers['User-Agent-x'] = 'SuiteScript-Call';
               headers['access-token'] = accesstoken;

               var urlProductMaster = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.PRODUCT_MASTER + GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER;
               log.debug('url', 'value: ' + urlLocationMaster);

               var response = https.post({
                  url: urlProductMaster,
                  headers: headers,
                  body: JSON.stringify(payload)
               });

               var strResponseBody = '';
               var strResponseCode = response.code;

               if (strResponseCode == 200 || strResponseCode == 201) {
                  strResponseBody = JSON.parse(response.body);
                  log.debug('strResponseBody', 'value: ' + response.body);
               }
            }
         }
      }

      function getSyncProductData(GLOBAL_CONSTANT){

         var arr = [];
         var searchProduct = GLOBAL_CONSTANT.SEARCH.PRODUCT;

         var searchProductObj = search.load({
            type: record.Type.INVENTORY_ITEM,
            id: searchProduct
         });
         var resultSet = searchProductObj.run();
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

      //endregion PRODUCT

      //region LOCATION

      function syncLocation(){

         var arr = getSyncLocationData(GLOBAL_CONSTANT);
         log.debug('arr', JSON.stringify(arr));

         var arrMappings = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ENTITY.LOCATION_MASTER);
         log.debug('arrMappings', JSON.stringify(arrMappings));

         var payload = {};
         var payloadEntityName = {};
         var arrRowData = [];

         if (!FS.isEmpty(arrMappings)) {

            for (var v in arr) {

               var rowData = {};
               var newRecord = record.load({
                  type: record.Type.LOCATION,
                  id: arr[v].id
               });

               for (var i in arrMappings) {
                  var netSuiteId = arrMappings[i].netsuite_id;
                  var firstShiftId = arrMappings[i].firstshift_id;
                  var tempValue = newRecord.getText({fieldId: netSuiteId.toString()});
                  if (FS.isEmpty(tempValue)) {
                     tempValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                  }
                  if (!FS.isEmpty(tempValue)) {
                     rowData[firstShiftId] = tempValue.toString();
                  }
               }
               arrRowData.push(rowData);
            }

            arrRowData.push(rowData);
            payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ENTITY.LOCATION_MASTER;
            payload.ENTITY_META_DATA = payloadEntityName;
            payload.rowData = arrRowData;

            log.debug('rowData', JSON.stringify(payload));

            if (!FS.isEmpty(arrRowData)) {

               var tokenResponse = FS.getTokenResponse();
               var tenantId = FS.getTenantId(tokenResponse);
               var accesstoken = FS.getToken(tokenResponse);

               log.debug('accesstoken: ' + accesstoken, JSON.stringify(payload));

               if (FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)) {
                  return;
               }

               var headers = new Object();
               headers['Content-Type'] = 'application/json;charset=utf-8';
               headers['Accept'] = 'application/json';
               headers['User-Agent-x'] = 'SuiteScript-Call';
               headers['access-token'] = accesstoken;

               var urlLocationMaster = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.LOCATION_MASTER + GLOBAL_CONSTANT.ENTITY.LOCATION_MASTER;
               log.debug('url', 'value: ' + urlLocationMaster);

               var response = https.post({
                  url: urlLocationMaster,
                  headers: headers,
                  body: JSON.stringify(payload)
               });

               var strResponseBody = '';
               var strResponseCode = response.code;

               if (strResponseCode == 200 || strResponseCode == 201) {
                  strResponseBody = JSON.parse(response.body);
                  log.debug('strResponseBody', 'value: ' + response.body);
               }
            }
         }
      }

      function getSyncLocationData(GLOBAL_CONSTANT){

         var arr = [];
         var searchLocation = GLOBAL_CONSTANT.SEARCH.LOCATION;

         var searchLocationObj = search.load({
            type: record.Type.LOCATION,
            id: searchLocation
         });
         var resultSet = searchLocationObj.run();
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

      //endregion LOCATION

      function syncCustomer(){

         var arr = getSyncCustomerData(GLOBAL_CONSTANT);
         log.debug('arr', JSON.stringify(arr));

         var arrMappings = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ENTITY.CUSTOMER_MASTER);
         log.debug('arrMappings', JSON.stringify(arrMappings));

         var payload = {};
         var payloadEntityName = {};
         var arrRowData = [];

         if (!FS.isEmpty(arrMappings)) {

            for (var v in arr) {

               var rowData = {};
               var newRecord = record.load({
                  type: record.Type.CUSTOMER,
                  id: arr[v].id
               });

               for (var i in arrMappings) {
                  var netSuiteId = arrMappings[i].netsuite_id;
                  var firstShiftId = arrMappings[i].firstshift_id;
                  var tempValue = newRecord.getText({fieldId: netSuiteId.toString()});
                  if (FS.isEmpty(tempValue)) {
                     tempValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                  }
                  if (!FS.isEmpty(tempValue)) {
                     rowData[firstShiftId] = tempValue.toString();
                  }
               }
               arrRowData.push(rowData);
            }

            arrRowData.push(rowData);
            payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ENTITY.CUSTOMER_MASTER;
            payload.ENTITY_META_DATA = payloadEntityName;
            payload.rowData = arrRowData;

            log.debug('rowData', JSON.stringify(payload));

            if (!FS.isEmpty(arrRowData)) {

               var tokenResponse = FS.getTokenResponse();
               var tenantId = FS.getTenantId(tokenResponse);
               var accesstoken = FS.getToken(tokenResponse);

               log.debug('accesstoken: ' + accesstoken, JSON.stringify(payload));

               if (FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)) {
                  return;
               }

               var headers = new Object();
               headers['Content-Type'] = 'application/json;charset=utf-8';
               headers['Accept'] = 'application/json';
               headers['User-Agent-x'] = 'SuiteScript-Call';
               headers['access-token'] = accesstoken;

               var urlCustomerMaster = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.CUSTOMER_MASTER + GLOBAL_CONSTANT.ENTITY.CUSTOMER_MASTER;
               log.debug('url', 'value: ' + urlCustomerMaster);

               var response = https.post({
                  url: urlCustomerMaster,
                  headers: headers,
                  body: JSON.stringify(payload)
               });

               var strResponseBody = '';
               var strResponseCode = response.code;

               if (strResponseCode == 200 || strResponseCode == 201) {
                  strResponseBody = JSON.parse(response.body);
                  log.debug('strResponseBody', 'value: ' + response.body);
               }
            }
         }
      }

      function syncVendor(){

         var arr = getSyncVendorData(GLOBAL_CONSTANT);
         log.debug('arr', JSON.stringify(arr));

         var arrMappings = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ENTITY.SOURCE_MASTER);
         log.debug('arrMappings', JSON.stringify(arrMappings));

         var payload = {};
         var payloadEntityName = {};
         var arrRowData = [];

         if (!FS.isEmpty(arrMappings)) {

            for (var v in arr) {

               var rowData = {};
               var newRecord = record.load({
                  type: record.Type.VENDOR,
                  id: arr[v].id
               });

               for (var i in arrMappings) {
                  var netSuiteId = arrMappings[i].netsuite_id;
                  var firstShiftId = arrMappings[i].firstshift_id;
                  var tempValue = newRecord.getText({fieldId: netSuiteId.toString()});
                  if (FS.isEmpty(tempValue)) {
                     tempValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                  }
                  if (!FS.isEmpty(tempValue)) {
                     rowData[firstShiftId] = tempValue.toString();
                  }
               }
               arrRowData.push(rowData);
            }

            arrRowData.push(rowData);
            payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ENTITY.SOURCE_MASTER;
            payload.ENTITY_META_DATA = payloadEntityName;
            payload.rowData = arrRowData;

            log.debug('rowData', JSON.stringify(payload));

            if (!FS.isEmpty(arrRowData)) {

               var tokenResponse = FS.getTokenResponse();
               var tenantId = FS.getTenantId(tokenResponse);
               var accesstoken = FS.getToken(tokenResponse);

               log.debug('accesstoken: ' + accesstoken, JSON.stringify(payload));

               if (FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)) {
                  return;
               }

               var headers = new Object();
               headers['Content-Type'] = 'application/json;charset=utf-8';
               headers['Accept'] = 'application/json';
               headers['User-Agent-x'] = 'SuiteScript-Call';
               headers['access-token'] = accesstoken;

               var urlVendorMaster = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.SOURCE_MASTER + GLOBAL_CONSTANT.ENTITY.SOURCE_MASTER;
               log.debug('url', 'value: ' + urlVendorMaster);

               var response = https.post({
                  url: urlVendorMaster,
                  headers: headers,
                  body: JSON.stringify(payload)
               });

               var strResponseBody = '';
               var strResponseCode = response.code;

               if (strResponseCode == 200 || strResponseCode == 201) {
                  strResponseBody = JSON.parse(response.body);
                  log.debug('strResponseBody', 'value: ' + response.body);
               }
            }
         }
      }

      function getSyncCustomerData(GLOBAL_CONSTANT){

         var arr = [];
         var searchCustomer = GLOBAL_CONSTANT.SEARCH.CUSTOMER;

         var searchCustomerObj = search.load({
            type: record.Type.CUSTOMER,
            id: searchCustomer
         });
         var resultSet = searchCustomerObj.run();
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

      function getSyncVendorData(GLOBAL_CONSTANT){

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
