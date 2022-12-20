/**
 * @NScriptName firstshift | MR | getMasterData
 * @NScriptId customscript_mr_fs_get_masterdata
 * @author eli@crowe
 * @filename firstshift_mr_getMasterData.js
 * @description Map/Reduce script to populate the "firstshift | Product Master Data"
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../SuiteScripts/firstshift_config.json
 *
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=3904
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2022     eli@crowe        Initial version
 *
 */

define(['common', 'N/record', 'N/runtime', 'N/url', 'N/https'],
   /**
    * @param {record} record
    */
   function(FS, record, runtime, url, https) {

      var GLOBAL_CONSTANT = FS.GLOBAL_CONSTANT();

      /**
       * Marks the beginning of the Map/Reduce process and generates input data.
       *
       * @typedef {Object} ObjectRef
       * @property {number} id - Internal ID of the record instance
       * @property {string} type - Record type id
       *
       * @return {Array|Object|Search|RecordRef} inputSummary
       * @since 2015.1
       */
      function getInputData() {
         try{
            var arr = getProductMasterData();
            log.debug('getInputData', JSON.stringify(arr));
            return arr;
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the map entry point is triggered and applies to each key/value pair.
       *
       * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
       * @since 2015.1
       */
      function map(context) {
         try {
            var valuePairs = JSON.parse(context.value);
            context.write({
               key: valuePairs._id,
               value: {
                  id: valuePairs._id,
                  entity_name: valuePairs.ENTITY_NAME,
               }
            });
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the reduce entry point is triggered and applies to each group.
       *
       * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
       * @since 2015.1
       */
      function reduce(context) {
         var valueArr = context.values.map(function (value) {
            return JSON.parse(value);
         });
         try {
            createProductMasterData(valueArr[0]);
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the summarize entry point is triggered and applies to the result set.
       *
       * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
       * @since 2015.1
       */
      function summarize(summary) {
         try {
            var type = summary.toString();
            log.audit('SUMMARY', 'Full summary: ' + summary);
            log.audit('SUMMARY', 'Usage Consumed: ' + summary.usage);
            log.audit('SUMMARY', 'Concurrency Number : ' + summary.concurrency);
            log.audit('SUMMARY', 'Number of Yields: ' + summary.yields);

         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      //region FUNCTIONS
      function getAllMasterData(){

         var rowData = [];
         var tokenResponse = FS.getTokenResponse();
         var tenantId = FS.getTenantId(tokenResponse);
         var accesstoken = FS.getToken(tokenResponse);

         if(FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)){
            return;
         }

         log.debug('FS', 'tenantId: ' + tenantId + ' | accesstoken: ' + accesstoken);

         var headers = new Object();
         headers['Content-Type'] = 'application/json;charset=utf-8';
         headers['Accept'] = 'application/json';
         headers['User-Agent-x'] = 'SuiteScript-Call';
         headers['access-token'] = accesstoken;

         var urlGetMasterData = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.GET.MASTER_DATA;

         var response = https.get({
            url: urlGetMasterData,
            headers: headers
         });

         var strResponseBody = '';
         var strResponseCode = response.code;

         if (strResponseCode == 200 || strResponseCode == 201) {
            strResponseBody = JSON.parse(response.body);
            var isSuccess = strResponseBody.success;
            if(isSuccess){
               log.debug('strResponseBody', 'value: ' + strResponseBody.data.rowData);
               rowData = strResponseBody.data.rowData;
            }
         }
         return rowData;
      }
      function createMasterData(valueArr){
         var id = valueArr.id;
         var entity_name = valueArr.entity_name;
         var create = record.create({
            type : 'customrecord_fs_master_data'
         });
         create.setValue({fieldId: 'custrecord_fs_md_id', value: id});
         create.setValue({fieldId: 'custrecord_fs_md_entity_name', value: entity_name});
         create.save();
      }
      //endregion FUNCTIONS


      return {
         getInputData: getInputData,
         map: map,
         reduce: reduce,
         summarize: summarize
      };

   });