/**
 * @author FS
 * @version 1.2
 * @NApiVersion 2.0
 * @NModuleScope public
 */
define(['N/error', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/url', 'N/https'],

   function (error, format, record, runtime, search, url, https) {

   function FS() { };

      //region FIRSTSHIFT UTILITIES
      var runTimeContext = runtime.getCurrentScript();
      var paramBaseUri = runTimeContext.getParameter({name : 'custscript_fs_base_uri'});

      FS.prototype.GLOBAL_CONSTANT = function() {
         return GLOBAL_CONSTANT = {
            ENDPOINT: {
               URI: paramBaseUri,
               GET : {
                  MASTER_DATA: '/model/MasterData',
                  MASTER_DATA_MAPPINGS : '/model/mappings/MasterData',
                  ORDER_DATA : '/model/Orders',
                  SALES_ORDER_DATA_MAPPINGS : '/model/mappings/Orders/Sales Order Detail',
                  PURCHASE_ORDER_DATA_MAPPINGS : '/model/mappings/Orders/Purchase Order Detail',
                  PRODUCTION_ORDER_DATA_MAPPINGS : '/model/mappings/Orders/Production Order Detail'
               },
               POST : {
                  PRODUCT_MASTER : '/data/EntityData?entityName=',
                  CUSTOMER_MASTER : '/data/EntityData?entityName=',
                  LOCATION_MASTER : '/data/EntityData?entityName=',
                  SOURCE_MASTER : '/data/EntityData?entityName=',
                  SALES_ORDER_DETAIL : '/data/EntityData?entityName='
               }
            },
            ENTITY : {
               PRODUCT_MASTER : 'Product Master',
               CUSTOMER_MASTER : 'Customer Master',
               LOCATION_MASTER : 'Location Master',
               SOURCE_MASTER : 'Source Master'
            },
            ORDER : {
               SALES_ORDER_DETAIL : 'Sales Order Detail'
            },
            TOKEN: {
               ID: 'customscript_sl_fs_token',
               DEPLOYMENT: 'customdeploy_sl_fs_token'
            }
         }
      }

      FS.prototype.getFirstShiftMappings = function (masterData) {

         var arrMappings = [];
         var searchFirstShiftMappings = search.create({
            type: 'customrecord_fs_mappings',
            filters:
               [
                  ['custrecord_fs_map_data_type.custrecord_fs_md_entity_name','is', masterData],
                  'AND',
                  ['custrecord_fs_ns_field_id','isnotempty','']
               ],
            columns:
               [
                  search.createColumn({
                     name: 'name',
                     sort: search.Sort.ASC,
                     label: 'Name'
                  }),
                  search.createColumn({name: 'custrecord_fs_map_data_type', label: 'Data Type'}),
                  search.createColumn({name: 'custrecord_fs_display_name', label: 'Display Name'}),
                  search.createColumn({name: 'custrecord_fs_source_table_column', label: 'Source Table Column'}),
                  search.createColumn({name: 'custrecord_fs_ns_field_name', label: 'NetSuite Field Name'}),
                  search.createColumn({name: 'custrecord_fs_ns_field_id', label: 'NetSuite Field ID'}),
                  search.createColumn({name: 'custrecord_fs_ns_line_level', label: 'Line Level'}),
                  search.createColumn({name: 'custrecord_fs_ns_type', label: 'Type'}),
               ]
         });

         searchFirstShiftMappings.run().each(function(result){
            arrMappings.push({
               firstshift_id : result.getValue({name: 'custrecord_fs_source_table_column'}),
               netsuite_id : result.getValue({name: 'custrecord_fs_ns_field_id'}),
               line_level : result.getValue({name: 'custrecord_fs_ns_line_level'}),
               type : result.getValue({name: 'custrecord_fs_ns_type'}),
            });
            return true;
         });

         return arrMappings;

      };

      FS.prototype.getTokenResponse = function () {

         var tokenURL = url.resolveScript({
            scriptId: GLOBAL_CONSTANT.TOKEN.ID,
            deploymentId: GLOBAL_CONSTANT.TOKEN.DEPLOYMENT,
            returnExternalUrl : true
         });
         var strResponseBody = https.get({
            url : tokenURL
         });
         var strResponseCode = strResponseBody.code;
         if (strResponseCode == 200 || strResponseCode == 201) {
            strResponseBody = strResponseBody.body;
         }
         return strResponseBody;
      };

      FS.prototype.getToken = function (response) {
         var parseToken = JSON.parse(response);
         var accessToken = parseToken.data['access-token'];
         return accessToken;
      };

      FS.prototype.getTenantId = function (response) {
         var parseToken = JSON.parse(response);
         var tenantId = parseToken.data['tenantId'];
         return tenantId;
      };

      FS.prototype.isEmpty = function (stValue) {
         return ((stValue === '' || stValue == null || stValue == undefined) ||
            (stValue.constructor === Array && stValue.length == 0) ||
            (stValue.constructor === Object && (function(v) {
               for (var k in v) return false;
               return true;
            })(stValue)));
      };
   //endregion FIRSTSHIFT UTILITIES


   //#region Common utilities

   FS.prototype.IsNullOrEmpty = function (_value) {
      if (_value === null || typeof _value === "undefined") {
         return true;
      } else if (util.isString(_value)) {
         if (_value.trim() === "" || _value.length === 0) {
            return true;
         }
      } else if (util.isArray(_value)) {
         if (_value.length === 0) {
            return true;
         }
      } else if (util.isObject(_value)) {
         for (var key in _value) {
            if (_value.hasOwnProperty(key)) {
               return false;
            }
         }
         return true;
      }
      return false;
   };

   /**
    * GetRemainingUsage: gets a value for the usage units remaining for the currently executing script.
    *
    * @see Supported server-side scripts.
    * @returns {number}.
    */
   FS.prototype.GetRemainingUsage = function () {
      return runtime.getCurrentScript().getRemainingUsage();
   };

   /**
    * GetAsArray: makes sure to return the given argument as an Array.
    *
    * @param {any} _value
    * @returns {Array}
    */
   FS.prototype.GetAsArray = function (_value) {
      return _value !== null ? util.isArray(_value) ? _value : [_value] : null;
   };

   /**
    * This function tries to parse an input to float,
    * otherwise, returns defined default value.
    *
    * @param {any} _number
    * @param {number} _defaultNumber [optional]
    * @returns {number}
    */
   FS.prototype.GetAsNumber = function (_number, _defaultNumber) {
      if (FS.IsNullOrEmpty(_defaultNumber)) {
         _defaultNumber = 0;
      }
      return isNaN(parseFloat(_number)) ? _defaultNumber : parseFloat(_number);
   };

   /**
    * ReturnEmptyIfNull: returns empty string instead a null value.
    *
    * @param {null} _value
    * @returns {string}
    */
   FS.prototype.ReturnEmptyIfNull = function (_value) {
      return _value !== null ? _value : "";
   };

   /**
    * GetPercentValue: takes a string representation of a percentage and returns a decimal representation.
    *
    * @param  {string} _strPercent
    * @returns {number}
    */
   FS.prototype.GetPercentValue = function (_strPercent) {
      if (FS.IsNullOrEmpty(_strPercent) || _strPercent.indexOf("%") === -1) {
         return 0.00;
      }
      var value = _strPercent.split("%");
      return (parseFloat(value[0]) / 100).toFixed(2);
   };

   /**
    * GetPercentString: takes a decimal representation of a percentage and returns a string representation.
    *
    * @param  {number} _numPercent
    * @returns {string}
    */
   FS.prototype.GetPercentString = function (_numPercent) {
      if (FS.IsNullOrEmpty(_numPercent)) {
         return "0.0%";
      }
      return (_numPercent * 100).toFixed(1) + "%";
   };

   /**
    * Round: takes a number and round it to defined decimal places.
    *
    * @param _number
    * @param _decimals [optional]
    * @returns {Number}
    */
   FS.prototype.Round = function (_number, _decimals) {
      var number = FS.GetAsNumber(_number);
      if (FS.IsNullOrEmpty(_decimals)) {
         _decimals = 0;
      }
      var negative = false;
      if (number < 0) {
         negative = true;
         number = Math.abs(number);
      }
      var multiplicator = Math.pow(10, _decimals);
      number = parseFloat((number * multiplicator).toFixed(11));
      number = (Math.round(number) / multiplicator).toFixed(_decimals);
      if (negative) {
         number = number * -1;
      }
      return number;
   };
   // #endregion

   // #region Date utilities
   /**
    * GetDate: function to get given date in format accepted by NetSuite.
    *
    * @example
    * .GetDate();
    * .GetDate(value);
    * .GetDate(dateString);
    * .GetDate(year, month [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);
    *
    * @param {integer} value. Integer value representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
    * @param {string} dateString. String value representing a date. The string should be in a format recognized by the Date.parse() method.
    * @param {integer} year. Integer value representing the year. Values from 0 to 99 map to the years 1900 to 1999.
    * @param {integer} month. Integer value representing the month, beginning with 0 for January to 11 for December.
    * @param {integer} day [optional]. Integer value representing the day of the month.
    * @param {integer} hours [optional]. Integer value representing the hour of the day.
    * @param {integer} minutes [optional]. Integer value representing the minute segment of a time.
    * @param {integer} seconds [optional]. Integer value representing the second segment of a time.
    * @param {integer} milliseconds [optional]. Integer value representing the millisecond segment of a time.
    *
    * @returns {string}
    */
   FS.prototype.GetDate = function (_date) {
      var date = !FS.IsNullOrEmpty(_date) ? new Date(_date) : new Date();
      return format.format({
         value: date,
         type: format.Type.DATE
      });
   };

   /**
    * GetDateTime: function to get current or given date in format accepted by NetSuite.
    *
    * @example
    * .GetDateTime();
    * .GetDateTime(value );
    * .GetDateTime(dateString);
    * .GetDateTime(year, month [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);
    *
    * @param {integer} value. Integer value representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
    * @param {string} dateString. String value representing a date. The string should be in a format recognized by the Date.parse() method.
    * @param {integer} year. Integer value representing the year. Values from 0 to 99 map to the years 1900 to 1999.
    * @param {integer} month. Integer value representing the month, beginning with 0 for January to 11 for December.
    * @param {integer} day [optional]. Integer value representing the day of the month.
    * @param {integer} hours [optional]. Integer value representing the hour of the day.
    * @param {integer} minutes [optional]. Integer value representing the minute segment of a time.
    * @param {integer} seconds [optional]. Integer value representing the second segment of a time.
    * @param {integer} milliseconds [optional]. Integer value representing the millisecond segment of a time.
    *
    * @returns {string}
    */
   FS.prototype.GetDateTime = function (_date) {
      var date = !FS.IsNullOrEmpty(_date) ? new Date(_date) : new Date();
      return format.format({
         value: date,
         type: format.Type.DATETIME
      });
   };

   /**
    * GetDateTimeTZ: function to get current or given date in format accepted by NetSuite.
    *
    * @example
    * .GetDateTimeTZ();
    * .GetDateTimeTZ(value );
    * .GetDateTimeTZ(dateString);
    * .GetDateTimeTZ(year, month [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);
    *
    * @param {integer} value. Integer value representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
    * @param {string} dateString. String value representing a date. The string should be in a format recognized by the Date.parse() method.
    * @param {integer} year. Integer value representing the year. Values from 0 to 99 map to the years 1900 to 1999.
    * @param {integer} month. Integer value representing the month, beginning with 0 for January to 11 for December.
    * @param {integer} day [optional]. Integer value representing the day of the month.
    * @param {integer} hours [optional]. Integer value representing the hour of the day.
    * @param {integer} minutes [optional]. Integer value representing the minute segment of a time.
    * @param {integer} seconds [optional]. Integer value representing the second segment of a time.
    * @param {integer} milliseconds [optional]. Integer value representing the millisecond segment of a time.
    *
    * @returns {string}
    */
   FS.prototype.GetDateTimeTZ = function (_date) {
      var date = !FS.IsNullOrEmpty(_date) ? new Date(_date) : new Date();
      return format.format({
         value: date,
         type: format.Type.DATETIMETZ
      });
   };

   /**
    * GetTime: Return time segment from given or current date in format accepted by NetSuite.
    *
    * @example
    * .GetTime();
    * .GetTime(value);
    * .GetTime(dateString);
    * .GetTime(year, month [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);
    *
    * @param {integer} value. Integer value representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
    * @param {string} dateString. String value representing a date. The string should be in a format recognized by the Date.parse() method.
    * @param {integer} year. Integer value representing the year. Values from 0 to 99 map to the years 1900 to 1999.
    * @param {integer} month. Integer value representing the month, beginning with 0 for January to 11 for December.
    * @param {integer} day [optional]. Integer value representing the day of the month.
    * @param {integer} hours [optional]. Integer value representing the hour of the day.
    * @param {integer} minutes [optional]. Integer value representing the minute segment of a time.
    * @param {integer} seconds [optional]. Integer value representing the second segment of a time.
    * @param {integer} milliseconds [optional]. Integer value representing the millisecond segment of a time.
    * @param {boolean} includeSeconds [optional]. Boolean value indicating if millisecond segment has to be returned.
    * @returns {string}
    */
   FS.prototype.GetTime = function (_date) {
      var date = !FS.IsNullOrEmpty(_date) ? new Date(_date) : new Date();
      return date.toLocaleTimeString('en-US', {
         hour12: true,
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit'
      }).replace(/:\d+ /, ' ');
   };

   /**
    * MillisecondToTime: converts milliseconds to readable format as hh:mm:ss.
    *
    * @param {integer} _milliseconds
    * @returns {string}.
    */
   FS.prototype.MillisecondToTime = function (_milliseconds) {
      var milliseconds = Math.floor((_milliseconds % 1000) * 1000) / 1000;
      var seconds = Math.floor(_milliseconds / 1000);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);

      seconds = seconds % 60;
      minutes = minutes % 60;
      hours = hours % 24;

      return hours.lpad(2, '0') + ":" + minutes.lpad(2, '0') + ":" + seconds.lpad(2, '0') + ":" + milliseconds.lpad(3, '0');
   };

   /**
    * GetMonth: Returns the month names or numbers.
    *
    * @example
    * .GetMonth.Name(1); // 'January'
    * .GetMonth.Number('June'); // 6
    */
   FS.prototype.GetMonth = function () {
      var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return {
         /**
          * @param {number} _number.
          * @returns {string}.
          */
         Name: function (_number) {
            return months[_number - 1];
         },
         /**
          * @param {string} _name.
          * @returns {number}.
          */
         Number: function (_name) {
            return months.indexOf(_name) + 1;
         }
      };
   };

   /**
    * GetWeekDay: Returns the day names or numbers.
    *
    * @example
    * .GetWeekDay.Name(2); // 'Monday'
    * .GetWeekDay.Number('Tuesday'); // 3
    */
   FS.prototype.GetWeekDay = function () {
      var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
         /**
          * @param {number} _number.
          * @returns {string}.
          */
         Name: function (_number) {
            return names[_number - 1];
         },
         /**
          * @param {string} _name.
          * @returns {number}.
          */
         Number: function (_name) {
            return names.indexOf(_name) + 1;
         }
      };
   };
   //#endregion

   //#region File utilities
   var folderNameCount = 0;
   var originalFolderName = null;

   /**
    * [Private]
    * createFolder: Creates a folder in the NetSuite file cabinet.
    *
    * @param {string} _folderName
    * @param {integer} _rootFolderId
    * @param {boolean} _isFirst
    * @returns {integer}. Internal id of newly created folder.
    */
   function createFolder(_folderName, _rootFolderId, _isFirst) {

      if (!FS.IsNullOrEmpty(_folderName)) {

         if (_isFirst) {
            originalFolderName = _folderName;
         }

         var folder = record.create({
            type: record.Type.FOLDER,
            isDynamic: false,
            defaultValues: null
         }).setValue({
            fieldId: 'name',
            value: _folderName
         });

         if (!FS.IsNullOrEmpty(_rootFolderId)) {
            folder.setValue({
               fieldId: 'parent',
               value: _rootFolderId
            });
         }

         try {
            return folder.save({
               enableSourcing: true,
               ignoreMandatoryFields: false
            });
         } catch (error) {
            if (error instanceof Error) {
               throw error;
            } else {
               if (error.message === "A folder with the same name already exists in the selected folder.") {
                  folderNameCount++;
                  return createFolder(originalFolderName + "_" + folderNameCount, _rootFolderId, false);
               } else {
                  FS.LogError('Error while creating a folder in File Cabinet', error);
               }
            }
         }
      }
   }

   /**
    * CreateFolder: Creates a folder in the NetSuite file cabinet.
    *
    * @see Governance usage: 15 units.
    *
    * @param {string} _folderName [required]. Name of folder to create.
    * @param {integer} _rootFolderId [required]. If creating a sub-folder, the root folder to create in.
    *            Leave this value null if you want to create your folder in the root NetSuite file cabinet.
    * @returns {integer}. Internal id of newly created folder.
    */
   FS.prototype.CreateFolder = function (_folderName, _rootFolderId) {
      return createFolder(_folderName, _rootFolderId, true);
   };
   //#endregion

   //#region Logging
   /**
    * @enum
    */
   FS.prototype.Level = {
      DEBUG: 'DEBUG',
      AUDIT: 'AUDIT',
      ERROR: 'ERROR',
      EMERGENCY: 'EMERGENCY'
   };

   /**
    * getLogLevel: gets the script logging level for the current script execution.
    *
    * @protected
    * @returns {string} Logging level.
    */
   function getLogLevel() {
      if (FS.IsNullOrEmpty(FS.LogLevel)) {
         FS.LogLevel = runtime.getCurrentScript().logLevel;
      }
      return FS.LogLevel;
   };

   /**
    * Property
    */
   FS.prototype.LogLevel = null;

   /**
    * LogExecution: logs script execution details.
    *
    * @param {string} _title [optional]. String to appear in the Title column on the Execution Log tab of the script deployment.
    * @param {any} _details [required]. Any value for this parameter.
    * @param {string} _logLevel [optional]. Logging level.
    */
   FS.prototype.LogExecution = function (_title, _details, _logLevel) {
      var title = FS.ReturnEmptyIfNull(_title);
      var details = FS.ReturnEmptyIfNull(_details);
      var loglevel = !FS.IsNullOrEmpty(_logLevel) ? _logLevel : getLogLevel();

      switch (loglevel) {
         // Log debug message
         case FS.Level.DEBUG:
            log.debug({
               title: title,
               details: details
            });
            break;
         // Log audit message
         case FS.Level.AUDIT:
            log.audit({
               title: title,
               details: details
            });
            break;
         // Log error message
         case FS.Level.ERROR:
            log.error({
               title: title,
               details: details
            });
            break;
         // Log emergency message
         case FS.Level.EMERGENCY:
            log.emergency({
               title: title,
               details: details
            });
            break;
      }
   };

   /**
    * LogError:
    *
    * @param {string} _title [optional]
    * @param {Object} _error [required]
    */
   FS.prototype.LogError = function (_title, _error) {
      if (typeof _error === 'object') {
         var details = "Name: " + _error.name + "\nMessage: " + _error.message + "\n";

         if (!FS.IsNullOrEmpty(_error.recordId)) {
            details += "Record Id: " + _error.recordId + "\n";
         }

         if (!FS.IsNullOrEmpty(_error.cause)) {
            details += "Code: " + _error.cause.code + "\nUser Event: " + _error.cause.userEvent + "\n";
         }

         if (!FS.IsNullOrEmpty(_error.stack)) {
            details += "Stack Trace:\n";
            for (var trace in _error.stack) {
               details += _error.stack[trace] + "\n";
            }
         }

         FS.LogExecution(FS.ReturnEmptyIfNull(_title), details, FS.Level.ERROR);
      }
   };

   /**
    * LogRemainingUsage: gets and logs the remaining usage.
    *
    * @see Supported server-side scripts.
    */
   FS.prototype.LogRemainingUsage = function () {
      FS.LogExecution('Remaining Usage', FS.GetRemainingUsage());
   };

   /**
    * StartBenchmark: Generates benchmark start date and logs to AUDIT log.
    *
    * @param {string} _event [optional]
    * @returns {Object}. Returns benchmark starting date and remaining usage as object.
    */
   FS.prototype.StartBenchmark = function (_event) {
      var event = !FS.IsNullOrEmpty(_event) ? "Benchmark Start: " + _event : "Benchmark Start";
      var startDateTime = new Date();

      FS.LogExecution(event, FS.GetDateTime(startDateTime), FS.Level.AUDIT);

      return {
         StartDateTime: startDateTime,
         StartUsage: FS.GetRemainingUsage()
      };
   };

   /**
    * EndBenchmark: Generates benchmark end date and logs to AUDIT log. If a start date is passed in, the total elapsed time is also calculated.
    *
    * @param {string} _event [optional]
    * @param {Date} _startDateTime [required]
    */
   FS.prototype.EndBenchmark = function (_event, _startDateTime) {
      var event = !FS.IsNullOrEmpty(_event) ? "Benchmark End: " + _event : "Benchmark End";
      var endDateTime = new Date();
      var totalUsage = _startDateTime.StartUsage - FS.GetRemainingUsage();
      var elapsedTime = null;

      if (!FS.IsNullOrEmpty(_startDateTime.StartDateTime)) {
         elapsedTime = FS.MillisecondToTime(endDateTime - _startDateTime.StartDateTime);
      }

      var details = FS.GetDateTime(endDateTime) + ". Elapsed Time: " + FS.ReturnEmptyIfNull(elapsedTime);

      if (totalUsage > 0) {
         details += ". Total Usage: " + totalUsage;
      }

      FS.LogExecution(event, details, FS.Level.AUDIT);
   };

   /**
    * ThrowError:
    *
    * @param {error.Type} _errorCode [required]
    * @param {string} _errorMessage [required]
    */
   FS.prototype.ThrowError = function (_errorCode, _errorMessage) {
      throw error.create({
         name: _errorCode,
         message: _errorMessage
      });
   };
   //#endregion

   //#region Object utilities
   /**
    * ArrayIndexOf:
    *
    * @param {Array} _array
    * @param {any} _value
    * @param {boolean} _ignoreCase. Ignore case sensitive.
    * @returns {integer}
    */
   FS.prototype.ArrayIndexOf = function (_array, _value, _ignoreCase) {
      for (var i = 0; _array && i < _array.length; i++) {
         if (_value === _array[i] || (_ignoreCase && _value && _array[i] && _value.toLowerCase() === _array[i].toLowerCase())) {
            return i;
         }
      }
      return -1;
   };

   /**
    * ObjectIndexOf:
    *
    * @param {Object} _object
    * @param {string} _property
    * @param {any} _value
    * @returns {integer}
    */
   FS.prototype.ObjectIndexOf = function (_object, _property, _value) {
      for (var i = 0; _object && i < _object.length; i++) {
         if (_object[i][_property] === _value) {
            return i;
         }
      }
      return -1;
   };

   /**
    * FindByProp: finds an object element by property.
    *
    * @see Governance usage: 0 units
    *
    * @param {object | array} object [required] - The target object.
    * @param {string} property [required] - The interested property to find.
    * @param {any} value [required] - The value of the interested property.
    * @param {string} returnProperty [optional] - Refers to another property in the element. If this parameter is set,
    *            will return the value of the returning property instead of entire found element.
    * @returns {object}. Entire object element of specific property value.
    */
   FS.prototype.FindByProp = function (_object, _property, _value, _returnProperty) {
      if (FS.IsNullOrEmpty(_object)) {
         return null;
      }
      if (_object[_property] === _value) {
         return _returnProperty ? _object[_returnProperty] : _object;
      }

      var result = undefined;
      for (var prop in _object) {
         if (_object.hasOwnProperty(prop) && typeof _object[prop] === 'object') {
            result = FS.FindByProp(_object[prop], _property, _value);
            if (result) {
               return _returnProperty ? result[_returnProperty] : result;
            }
         }
      }

      return _returnProperty ? result[_returnProperty] : result;
   };

   /**
    * Unique: returns an Array with Unique/Non-Duplicate values (Single property array).
    *
    * @param {Array} _array [required].
    * @returns {Array}.
    */
   FS.prototype.Unique = function (_array) {
      var aux = {};
      var arr = new Array();

      for (var i = 0; i < _array.length; i++) {
         if (!aux[_array[i]]) {
            aux[_array[i]] = true;
            arr.push(_array[i]);
         }
      }

      return arr;
   };

   /**
    * ObjectCompareBy: is a callback function that helps order objects in array
    *
    * @example
    * var charges = [
    * 	{item: 23456, qty: 1, rate:23.45},
    *	{item: 34657, qty: 1, rate:20},
    *	{item: 23456, qty: 1, rate:25},
    *	{item: 65654, qty: 1, rate:21}
    * ];
    * charges.sort(FS.ObjectCompareBy('item'));
    *
    * [{"item":23456,"qty":1,"rate":23.45},
    *  {"item":23456,"qty":1,"rate":25},
    *  {"item":34657,"qty":1,"rate":20},
    *  {"item":65654,"qty":1,"rate":21}]
    *
    * @param {string} _property [required]. Property name
    * @param {string} _order [optional]. Possible values: 'asc' or 'desc'
    * @returns {Function}
    */
   FS.prototype.ObjectCompareBy = function (_property, _order) {
      return function (_curr, _next) {
         if (FS.IsNullOrEmpty(_order)) {
            _order = 'asc';
         }

         if (!_curr.hasOwnProperty(_property) || !_next.hasOwnProperty(_property)) {
            return 0;
         }

         var a = (typeof _curr[_property] === 'string') ? _curr[_property].toUpperCase() : _curr[_property];
         var b = (typeof _next[_property] === 'string') ? _next[_property].toUpperCase() : _next[_property];

         var comparison = 0;
         if (a > b) {
            comparison = 1;
         } else if (a < b) {
            comparison = -1;
         }

         return ((_order == 'desc') ? (comparison * -1) : comparison);
      };
   };
   // #endregion

   // #region Record utilities
   var transactionStatus = {
      Bill: [{
         name: 'Open',
         value: 'VendBill:A'
      }, {
         name: 'Paid In Full',
         value: 'VendBill:B'
      }],
      BillPayment: [{
         name: 'Voided',
         value: 'VendPymt:V'
      }, {
         name: 'Online Bill Pay Pending Accounting Approval',
         value: 'VendPymt:Z'
      }],
      CashSale: [{
         name: 'Unapproved Payment',
         value: 'CashSale:A'
      }, {
         name: 'Not Deposited',
         value: 'CashSale:B'
      }, {
         name: 'Deposited',
         value: 'CashSale:C'
      }],
      Check: [{
         name: 'Voided',
         value: 'Check:V'
      }, {
         name: 'Online Bill Pay Pending Accounting Approval',
         value: 'Check:Z'
      }],
      Commission: [{
         name: 'Pending Payment',
         value: 'Commissn:A'
      }, {
         name: 'Overpaid',
         value: 'Commissn:O'
      }, {
         name: 'Pending Accounting Approval',
         value: 'Commissn:P'
      }, {
         name: 'Rejected by Accounting',
         value: 'Commissn:R'
      }, {
         name: 'Paid in Full',
         value: 'Commissn:X'
      }],
      CreditMemo: [{
         name: 'Open',
         value: 'CustCred:A'
      }, {
         name: 'Fully Applied',
         value: 'CustCred:B'
      }],
      CustomerDeposit: [{
         name: 'Not Deposited',
         value: 'CustDep:A'
      }, {
         name: 'Deposited',
         value: 'CustDep:B'
      }, {
         name: 'Fully Applied',
         value: 'CustDep:C'
      }],
      CustomerRefund: [{
         name: 'Voided',
         value: 'CustRfnd:V'
      }],
      ExpenseReport: [{
         name: 'In Progress',
         value: 'ExpRept:A'
      }, {
         name: 'Pending Supervisor Approval',
         value: 'ExpRept:B'
      }, {
         name: 'Pending Accounting Approval',
         value: 'ExpRept:C'
      }, {
         name: 'Rejected by Supervisor',
         value: 'ExpRept:D'
      }, {
         name: 'Rejected by Accounting',
         value: 'ExpRept:E'
      }, {
         name: 'Approved by Accounting',
         value: 'ExpRept:F'
      }, {
         name: 'Approved (Overridden) by Accounting',
         value: 'ExpRept:G'
      }, {
         name: 'Rejected (Overridden) by Accounting',
         value: 'ExpRept:H'
      }, {
         name: 'Paid In Full',
         value: 'ExpRept:I'
      }],
      Invoice: [{
         name: 'Open',
         value: 'CustInvc:A'
      }, {
         name: 'Paid In Full',
         value: 'CustInvc:B'
      }],
      ItemFulfillment: [{
         name: 'Picked',
         value: 'ItemShip:A'
      }, {
         name: 'Packed',
         value: 'ItemShip:B'
      }, {
         name: 'Shipped',
         value: 'ItemShip:C'
      }],
      Journal: [{
         name: 'Pending Approval',
         value: 'Journal:A'
      }, {
         name: 'Approved for Posting',
         value: 'Journal:B'
      }],
      Opportunity: [{
         name: 'In Progress',
         value: 'Opprtnty:A'
      }, {
         name: 'Issued Estimate',
         value: 'Opprtnty:B'
      }, {
         name: 'Closed - Won',
         value: 'Opprtnty:C'
      }, {
         name: 'Closed - Lost',
         value: 'Opprtnty:D'
      }],
      Paycheck: [{
         name: 'Undefined',
         value: 'Paycheck:A'
      }, {
         name: 'Pending Tax Calculation',
         value: 'Paycheck:C'
      }, {
         name: 'Pending Commitment',
         value: 'Paycheck:D'
      }, {
         name: 'Committed',
         value: 'Paycheck:F'
      }, {
         name: 'Preview',
         value: 'Paycheck:P'
      }, {
         name: 'Reversed',
         value: 'Paycheck:R'
      }],
      Payment: [{
         name: 'Unapproved Payment',
         value: 'CustPymt:A'
      }, {
         name: 'Not Deposited',
         value: 'CustPymt:B'
      }, {
         name: 'Deposited',
         value: 'CustPymt:C'
      }],
      PayrollLiabilityCheck: [{
         name: 'Voided',
         value: 'LiabPymt:V'
      }],
      PurchaseOrder: [{
         name: 'Pending Supervisor Approval',
         value: 'PurchOrd:A'
      }, {
         name: 'Pending Receipt',
         value: 'PurchOrd:B'
      }, {
         name: 'Rejected by Supervisor',
         value: 'PurchOrd:C'
      }, {
         name: 'Partially Received',
         value: 'PurchOrd:D'
      }, {
         name: 'Pending Billing/Partially Received',
         value: 'PurchOrd:E'
      }, {
         name: 'Pending Bill',
         value: 'PurchOrd:F'
      }, {
         name: 'Fully Billed',
         value: 'PurchOrd:G'
      }, {
         name: 'Closed',
         value: 'PurchOrd:H'
      }],
      Quote: [{
         name: 'Open',
         value: 'Estimate:A'
      }, {
         name: 'Processed',
         value: 'Estimate:B'
      }, {
         name: 'Closed',
         value: 'Estimate:C'
      }, {
         name: 'Voided',
         value: 'Estimate:V'
      }, {
         name: 'Expired',
         value: 'Estimate:X'
      }],
      ReturnAuthorization: [{
         name: 'Pending Approval',
         value: 'RtnAuth:A'
      }, {
         name: 'Pending Receipt',
         value: 'RtnAuth:B'
      }, {
         name: 'Cancelled',
         value: 'RtnAuth:C'
      }, {
         name: 'Partially Received',
         value: 'RtnAuth:D'
      }, {
         name: 'Pending Refund/Partially Received',
         value: 'RtnAuth:E'
      }, {
         name: 'Pending Refund',
         value: 'RtnAuth:F'
      }, {
         name: 'Refunded',
         value: 'RtnAuth:G'
      }, {
         name: 'Closed',
         value: 'RtnAuth:H'
      }],
      SalesOrder: [{
         name: 'Pending Approval',
         value: 'SalesOrd:A'
      }, {
         name: 'Pending Fulfillment',
         value: 'SalesOrd:B'
      }, {
         name: 'Cancelled',
         value: 'SalesOrd:C'
      }, {
         name: 'Partially Fulfilled',
         value: 'SalesOrd:D'
      }, {
         name: 'Pending Billing/Partially Fulfilled',
         value: 'SalesOrd:E'
      }, {
         name: 'Pending Billing',
         value: 'SalesOrd:F'
      }, {
         name: 'Billed',
         value: 'SalesOrd:G'
      }, {
         name: 'Closed',
         value: 'SalesOrd:H'
      }],
      SalesTaxPayment: [{
         name: 'Voided',
         value: 'TaxPymt:V'
      }, {
         name: 'Online Bill Pay Pending Accounting Approval',
         value: 'TaxPymt:Z'
      }],
      StatementCharge: [{
         name: 'Open',
         value: 'CustChrg:A'
      }, {
         name: 'Paid In Full',
         value: 'CustChrg:B'
      }],
      TegataPayable: [{
         name: 'Endorsed',
         value: 'TegPybl:E'
      }, {
         name: 'Issued',
         value: 'TegPybl:I'
      }, {
         name: 'Paid',
         value: 'TegPybl:P'
      }],
      TegataReceivables: [{
         name: 'Collected',
         value: 'TegRcvbl:C'
      }, {
         name: 'Discounted',
         value: 'TegRcvbl:D'
      }, {
         name: 'Endorsed',
         value: 'TegRcvbl:E'
      }, {
         name: 'Holding',
         value: 'TegRcvbl:H'
      }],
      TransferOrder: [{
         name: 'Pending Approval',
         value: 'TrnfrOrd:A'
      }, {
         name: 'Pending Fulfillment',
         value: 'TrnfrOrd:B'
      }, {
         name: 'Rejected',
         value: 'TrnfrOrd:C'
      }, {
         name: 'Partially Fulfilled',
         value: 'TrnfrOrd:D'
      }, {
         name: 'Pending Receipt/Partially Fulfilled',
         value: 'TrnfrOrd:E'
      }, {
         name: 'Pending Receipt',
         value: 'TrnfrOrd:F'
      }, {
         name: 'Received',
         value: 'TrnfrOrd:G'
      }, {
         name: 'Closed',
         value: 'TrnfrOrd:H'
      }],
      VendorReturnAuthorization: [{
         name: 'Pending Approval',
         value: 'VendAuth:A'
      }, {
         name: 'Pending Return',
         value: 'VendAuth:B'
      }, {
         name: 'Cancelled',
         value: 'VendAuth:C'
      }, {
         name: 'Partially Returned',
         value: 'VendAuth:D'
      }, {
         name: 'Pending Credit/Partially Returned',
         value: 'VendAuth:E'
      }, {
         name: 'Pending Credit',
         value: 'VendAuth:F'
      }, {
         name: 'Credited',
         value: 'VendAuth:G'
      }, {
         name: 'Closed',
         value: 'VendAuth:H'
      }],
      WorkOrder: [{
         name: 'Pending Build',
         value: 'WorkOrd:B'
      }, {
         name: 'Cancelled',
         value: 'WorkOrd:C'
      }, {
         name: 'Partially Built',
         value: 'WorkOrd:D'
      }, {
         name: 'Built',
         value: 'WorkOrd:G'
      }, {
         name: 'Closed',
         value: 'WorkOrd:H'
      }]
   };

   /**
    * getItemType: gets internal item type.
    *
    * @protected
    * @param {string} _type [required] - Item type.
    * @returns {string}
    */
   function getItemType(_type) {

      switch (_type.toLowerCase()) {
         case 'assembly':
            return 'assemblyitem';

         case 'description':
            return 'descriptionitem';

         case 'discount':
            return 'discountitem';

         case 'dwnlditem':
            return 'downloaditem';

         case 'endgroup':
            return null;

         case 'giftcert':
            return 'giftcertificateitem';

         case 'group':
            return null;

         case 'invtpart':
            return 'inventoryitem';

         case 'kit':
            return 'kititem';

         case 'markup':
            return 'markupitem';

         case 'noninvtpart':
            return 'noninventoryitem';

         case 'othcharge':
            return 'otherchargeitem';

         case 'payment':
            return 'paymentitem';

         case 'service':
            return 'serviceitem';

         case 'shipitem':
            return null;

         case 'subtotal':
            return 'subtotalitem';

         case 'taxgroup':
            return 'taxgroup';

         case 'taxitem':
            return null;

         default:
            return null;
      }
   }

   /**
    * GetTransactionStatusCode: translates transactions statuses names to statuses codes.
    *
    * @example
    * .GetTransactionStatusCode('SalesOrder', ['Pending Approval', 'Pending Fulfillment', 'Closed']) // ['SalesOrd:A', 'SalesOrd:B', 'SalesOrd:H']
    *
    * @param  {string} _transaction [required]
    * @param  {Array} _array [required]
    * @returns {Array}
    */
   FS.prototype.GetTransactionStatusCode = function (_transaction, _array) {
      var status = new Array();
      var array = FS.GetAsArray(_array);

      if (!FS.IsNullOrEmpty(_transaction) && !FS.IsNullOrEmpty(array)) {
         for (var transaction in transactionStatus) {
            if (transaction === _transaction) {
               for (var i = 0; i < array.length; i++) {
                  var value = FS.FindByProp(transactionStatus[transaction], 'name', array[i], 'value');
                  if (!FS.IsNullOrEmpty(value)) {
                     status.push(value);
                  }
               }
               break;
            }
         }
      }
      return status;
   };

   /**
    * GetAccountType: gets the actual internal account type.
    *
    * @see Governance usage: 1 unit
    *
    * @param {int|string} _accountId [required] - Account internal id.
    * @returns {string}
    */
   FS.prototype.GetAccountType = function (_accountId) {
      if (!FS.IsNullOrEmpty(_accountId)) {
         var accountType = search.lookupFields({
            type: search.Type.ACCOUNT,
            id: _accountId,
            columns: ['type']
         });

         if (!FS.IsNullOrEmpty(accountType)) {
            return accountType.type[0].value;
         }
      }
      return null;
   };

   /**
    * GetEntityType: gets the actual internal entity type.
    *
    * @see Governance usage: 1 unit
    *
    * @param {int|string} _entityId [required] - Entity internal id.
    * @returns {string}
    */
   FS.prototype.GetEntityType = function (_entityId) {
      if (!FS.IsNullOrEmpty(_entityId)) {
         var entityType = search.lookupFields({
            type: search.Type.ENTITY,
            id: _entityId,
            columns: ['type']
         });

         switch (entityType.type[0].value) {
            case 'CustJob':
               return 'customer';

            case 'Partner':
               return 'partner';

            case 'Vendor':
               return 'vendor';

            default:
               return null;
         }
      }
      return null;
   };

   /**
    * GetItemType: gets internal type.
    *
    * @example
    * InvtPart = inventoryitem.
    * "inventoryitem" must be used when loading a record and in other cases, but InvtPart is returned from sublists as the item type.
    *
    * @see Governance usage: 0 unit
    *
    * @param {string} _itemType [required] - Item type.
    * @returns {string}
    */
   FS.prototype.GetItemType = function (_itemType) {
      if (!FS.IsNullOrEmpty(_itemType)) {
         return getItemType(_itemType);
      }
      return null;
   };

   /**
    * GetItemTypeById: gets item record type id by item internal id.
    *
    * @see Governance usage: 1 unit
    *
    * @param {int|string} _itemId, Item internal id.
    * @returns {string}
    */
   FS.prototype.GetItemTypeById = function (_itemId) {
      if (!FS.IsNullOrEmpty(_itemId)) {
         var itemType = search.lookupFields({
            type: search.Type.ITEM,
            id: _itemId,
            columns: ['type']
         });

         if (!FS.IsNullOrEmpty(itemType)) {
            return getItemType(itemType.type[0].value);
         }
      }
      return null;
   };
   //#endregion

   //#region Search utilities
   /**
    * [Private]
    * getAllResults: method designed to be called recursively for more than 4000 records.
    *
    * @protected
    * @param {object} _searchObj [required] - The search.create object.
    * @param {number} _lastId [optional] internal - Internal ID number for pagination purposes.
    * @returns {Array}. Search.ResultSet objects
    */
   function getAllResults(_searchObj, _searchResults, _lastId) {

      if (FS.IsNullOrEmpty(_searchObj)) {
         throw 'Function requires search object to be loaded';
      }

      try {
         var count = 0;

         // Check pagination
         if (typeof _lastId === 'undefined') {
            _lastId = null;
         }

         if (typeof _searchResults === 'undefined') {
            _searchResults = [];
         }

         if (!FS.IsNullOrEmpty(_lastId)) {
            // Add InternalIdNumber filter for the next loop
            var filters = _searchObj.filters;

            filters.push(search.createFilter({
               name: 'internalidnumber',
               operator: search.Operator.GREATERTHAN,
               values: _lastId
            }));
         }

         // Validate and set Internal ID column sortable
         var columns = _searchObj.columns;
         var hasInternalId = false;

         for (var i = 0; i < columns.length; i++) {
            if (columns[i].name === 'internalid') {
               // Set Internal ID column ascending sort
               columns[i].sort = search.Sort.ASC;
               hasInternalId = true;
            } else if (!FS.IsNullOrEmpty(columns[i].sort) && columns[i].sort !== search.Sort.NONE) {
               // Removes sort properties to others columns
               columns[i].sort = search.Sort.NONE;
            }
         }

         // Add Internal ID column in case that is not provided in the search
         if (!hasInternalId) {
            columns.push(search.createColumn({
               name: 'internalid',
               sort: search.Sort.ASC
            }));
         }

         // Loops through search results
         // ResultSet.each governance usage: 10 units
         _searchObj.run().each(function (result) {

            _lastId = result.getValue({
               name: 'internalid'
            });

            _searchResults.push(result);

            count++;
            if (count < 4000) {
               return true;
            } else {
               getAllResults(_searchObj,_searchResults, _lastId);
            }

            return false;
         });
      } catch (e) {
         FS.LogError('getAllResults()', e);
         throw e;
      }

      return _searchResults;
   };

   /**
    * GetAllResults: retrieves all records from a search object (search.create or search.load).
    *
    * @see Governance usage: 10 units per 4000 records.
    *
    * @param  {object} _searchObj [required] - The search.create object.
    * @returns {Array}. search.ResultSet objects.
    */
   FS.prototype.GetAllResults = function (_searchObj) {
      return getAllResults(_searchObj);
   };
   //#endregion

   //#region Script
   /**
    * scriptBase: Base script structure definition to be used on script starters.
    *
    * @protected
    * @param {any} _args
    * @constructor
    */
   FS.prototype.ScriptBase = function (_args) {

      this.ScriptType = runtime.ContextType;
      this.Context = null;
      this.EntryPoint = null;
      this.Args = {};
      this.Parms = [];
      this.AllowDelete = true;
      this.AllowFieldChange = true;
      this.AllowLineChange = true;
      this.AllowLineInsert = true;
      this.AllowSave = true;
      this.RESTletReturn = null;
      this.Record = null;
      /**
       * Runs all modules pass in.
       *
       * @param {Array} _module
       */
      this.Run = function (_module) {
         for (var i = 0; _module && i < _module.length; i++) {
            _module[i]();
         }
      };
      /**
       * Gets all defined script parameters
       *
       * @param {Array} _parms
       */
      this.GetParameters = function (_parms) {
         for (var i = 0; _parms && i < _parms.length; i++) {
            this.Parms[_parms[i]] = runtime.getCurrentScript().getParameter({
               name: _parms[i]
            });
         }
      };
      /**
       * Initialize properties
       */
      if (!FS.IsNullOrEmpty(_args)) {
         if (!FS.IsNullOrEmpty(_args.Context)) {
            this.Context = _args.Context;
         }
         if (!FS.IsNullOrEmpty(_args.EntryPoint)) {
            this.EntryPoint = _args.EntryPoint;
         }
         if (!FS.IsNullOrEmpty(_args.Args)) {
            this.Args = _args.Args;
         }
         if (!FS.IsNullOrEmpty(_args.Parms)) {
            this.GetParameters(_args.Parms);
         }
      }
   };
   //#endregion

   //#region Others
   /**
    * lpad() pads the current string with another string (repeated, if needed) so that the resulting string reaches the given length. The padding is applied
    * from the left of the current string.
    *
    * @example
    * 'A'.lpad(3, 'B'); // returns 'BBA'
    * 'A'.lpad(4, 'B'); // returns 'BBBA'
    *
    * @param {integer} _targetLength [required] - The length of the resulting string once the current string has been padded.
    * @param {string} _padString [required] - The string to pad the current string with.
    * @returns {string} Padding string
    */
   String.prototype.lpad = function (_targetLength, _padString) {
      var str = String(this);
      while (str.length < (_targetLength || 2)) {
         str = _padString + str;
      }
      return str;
   };

   Number.prototype.lpad = function (_targetLength, _padString) {
      var str = String(this);
      while (str.length < (_targetLength || 2)) {
         str = _padString + str;
      }
      return str;
   };
   //#endregion

   FS = new FS();

   return FS;
});