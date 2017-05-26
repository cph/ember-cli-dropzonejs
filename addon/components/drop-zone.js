/* global Dropzone*/
import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['dropzone'],

  myDropzone: document.body || undefined,

  dropzoneOptions: null,

  // Configuration Options
  dzOptionsList: [
    'url', 'withCredentials', 'method', 'parallelUploads', 'maxFilesize', 'filesizeBase',
    'paramName', 'uploadMultiple', 'headers', 'addRemoveLinks', 'previewsContainer',
    'clickable', 'maxThumbnailFilesize', 'thumbnailWidth', 'thumbnailHeight', 'maxFiles',
    'createImageThumbnails', 'params', 'acceptedFiles', 'autoProcessQueue', 'forceFallback',
    'previewTemplate', 'dictDefaultMessage', 'dictFallbackMessage', 'dictInvalidFileType',
    'dictFallbackText', 'dictFileTooBig', 'dictResponseError', 'dictCancelUpload',
    'dictCancelUploadConfirmation', 'dictRemoveFile', 'dictMaxFilesExceeded', 'maxDropRegion'
  ],

  dzConfigHash: {},

  // Need to preserve null default values
  thumbnailHeight: null,
  thumbnailWidth: null,

  // Events
  // All of these receive the event as first parameter:
  drop: null,
  dragstart: null,
  dragend: null,
  dragenter() {},
  dragover() {},
  dragleave: null,

  // All of these receive the file as first parameter:
  addedfile: null,
  removedfile: null,
  thumbnail: null,
  error: null,
  processing: null,
  uploadprogress: null,
  sending: null,
  success: null,
  complete: null,
  canceled: null,
  maxfilesreached: null,
  maxfilesexceeded: null,

  // All of these receive a list of files as first parameter and are only called if the uploadMultiple option is true:
  processingmultiple: null,
  sendingmultiple: null,
  successmultiple: null,
  completemultiple: null,
  canceledmultiple: null,

  // Special events:
  totaluploadprogress: null,
  reset: null,
  queuecomplete: null,
  files: null,

  // Callback functions
  accept: null,

  setEvents() {
    let myDropzone = this.get('myDropzone');
    let events = {
      drop: this.drop,
      dragstart: this.dragstart,
      dragend: this.dragend,
      dragenter: this.dragenter,
      dragover: this.dragover,
      dragleave: this.dragleave,
      addedfile: this.addedfile,
      removedfile: this.removedfile,
      thumbnail: this.thumbnail,
      error: this.error,
      processing: this.processing,
      uploadprogress: this.uploadprogress,
      sending: this.sending,
      success: this.success,
      complete: this.complete,
      canceled: this.canceled,
      maxfilesreached: this.maxfilesreached,
      maxfilesexceeded: this.maxfilesexceeded,
      processingmultiple: this.processingmultiple,
      sendingmultiple: this.sendingmultiple,
      successmultiple: this.successmultiple,
      completemultiple: this.completemultiple,
      canceledmultiple: this.canceledmultiple,
      totaluploadprogress: this.totaluploadprogress,
      reset: this.reset,
      queuecomplete: this.queuecomplete,
      files: this.files,
      accept: this.accept,
    };

    for (let e in events) {
      if (events[e] !== null) {
        myDropzone.on(e, events[e]);
      }
    }
  },

  config: Ember.computed(function(){
    let config = this.get('dzConfigHash'),
        optList = this.get('dzOptionsList'),
        output = {};

    optList.forEach((e) => {
      // use dynamic hash first
      if (config[e]) {
        output[e] = config[e];
      }

      // if property is set specifically, override
      if (this.get(e)) {
        output[e] = this.get(e);
      }

      // need to set null versions of thumbnail width / height
      if (e === 'thumbnailHeight' || e === 'thumbnailWidth') {
        output[e] = this.get(e)
      }
    });

    return output;
  }),

  getDropzoneOptions() {
    const onDragEnterLeaveHandler = function(dropzoneInstance) {
      const onDrag = ( element => {
        let dragCounter = 0;

        return {
          enter(event) {
            event.preventDefault();
            dragCounter++;
            element.classList.add('dz-drag-hover');
          },
          leave() {
            dragCounter--;

            if (dragCounter === 0) {
              element.classList.remove('dz-drag-hover');
            }
          }
        };
      }).call(this, dropzoneInstance.element);

      dropzoneInstance.on('dragenter', onDrag.enter);
      dropzoneInstance.on('dragleave', onDrag.leave);
    };

    let config = this.get('config');
    config.init = function () { onDragEnterLeaveHandler(this); }

    this.set('dropzoneOptions', config);
  },

  createDropzone(element) {
    let region = this.get('maxDropRegion') ? document.body : element;
    this.set('myDropzone', new Dropzone(region, this.dropzoneOptions));
  },

  destroyDropzone: Ember.on('willDestroyElement', function() {
    this.get('myDropzone').destroy();
  }),

  insertDropzone: Ember.on('didInsertElement', function() {
    let _this = this;
    this.getDropzoneOptions();
    Dropzone.autoDiscover = false;
    this.createDropzone(this.element);
    //make sure events are set before any files are added
    this.setEvents();

    //this condition requires a fully resolved array to work
    //will not work with model.get('files') as it returns promise not array hence length condition is failed
    if (this.files && this.files.length > 0) {
      this.files.map(function(file) {
        let dropfile = {
          name: file.get('name'),
          type: file.get('type'),
          size: file.get('size'),
          status: Dropzone.ADDED,
          //add support for id  in files object so that it can be access in addedFile,removedFile callbacks for files identified by id
          id: file.get('id')
        };
        let thumbnail = file.get('thumbnail');

        if (typeof (thumbnail) === 'string') {
          dropfile.thumbnail = thumbnail;
        }

        _this.myDropzone.emit('addedfile', dropfile);

        if (typeof (thumbnail) === 'string') {

          _this.myDropzone.emit('thumbnail', dropfile, thumbnail);
        }

        _this.myDropzone.emit('complete', dropfile);
        _this.myDropzone.files.push(file);
      });
    }

    return this.myDropzone;
  }),
});
