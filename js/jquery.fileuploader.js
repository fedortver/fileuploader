;
(function ($) {
    var defaults = {
        buttonUploadText: 'Upload',//text of upload button
        inputFileList: [], //files that were choosen by user for additing
        fileList: [], //main collection with files
        fileListAdd: [], //new portion of files for ADDING to the list (no redrow every time, when new file adds)
        filteredFiles: [], //all filtered files (for counting) - TODO jast int filteredFilesNumber   
        filteredFilesToAdd: [], //filtered files after every adding for displaying at the end of previewlist
        filesExt: ['jpeg', 'png', 'jpg'],//extension files
        maxFileSize: 10485760,// max file size
        maxCountFiles: 5,// max count files
        addToMainLink:false,// add main link for images
        maxFileSizeMes:'Max file size 10MB',//max file size error message
        maxCountFilesMes:'Max count files 5',//max filea count error message
        addErrorBlock:true,//add error block in DOM
        limitImgErrorClass:'limit-img-error',//class of limit img
        limitCountErrorClass:'limit-count-error',// class of limit count files
    }

    var methods = {
        init: function (options) {
            return this.each(function () {
                var config = $.extend(true, {}, defaults, options);
                var countImg = 0,
                    container = $(this),
                    imgList = container.find('#ulImglist'),
                    dropZone = container.find('#divDropZone')[0],
                    fileInput = container.find('#fileInput'),
                    uploadButton = container.find('#uploadButton'),
                    mainPictureInput = container.find('#mainPictureName');

                    //add error container
                    if(config.addErrorBlock){
                        fileInput.after('<div class="errors-container"><p class="'+config.limitImgErrorClass+'">'+config.maxFileSizeMes+'</p><p class="'+config.limitCountErrorClass+'">'+config.maxCountFilesMes+'</p></div>')
                    }
                
                //add listenr for upload button    
                uploadButton.on('click', function (e) {
                    e.preventDefault();
                    fileInput.click();
                });

                //bind fileinput listener
                fileInput.bind({
                    change: function () {
                        if (typeof (GetFiles) === "function") {
                            GetFiles(this.files);
                        } else {
                            alert('Define GetFiles() function!');
                        }
                    }
                });

                //dropZone
                if (typeof (dropZone) === "undefined") {
                    alert('Define divDropZone area failed!');
                }
                dropZone.addEventListener('dragenter', handleDragEnter, false);
                dropZone.addEventListener('dragover', handleDragOver, false);
                dropZone.addEventListener('dragleave', handleDragLeave, false);
                dropZone.addEventListener('drop', handleFileSelect, false);
                
                //drop
                function handleFileSelect(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (typeof (GetFiles) === "function") {
                        GetFiles(evt.dataTransfer.files);
                    }
                    else {
                        alert('Define GetFiles() function!');
                    }
                };

                //dragover
                function handleDragOver(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    evt.dataTransfer.dropEffect = 'copy';
                    return false;
                };
                //dragenter
                function handleDragEnter(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    $(this).addClass('highlighted');
                    return false;
                };
                //dragleave
                function handleDragLeave(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    $(this).removeClass('highlighted');
                    return false;
                };

               GetFormDataWithFiles = function () {
                    var formData = new FormData();
                    $.each(config.fileList, function (i, file) {
                        formData.append(file.name, file); // fill formData with files
                    });
                    return formData;
                };

                function GetFiles(files) {
                    if (!MaxFilesQuantityValidate(files)) {
                        return;
                    }
                    config.inputFileList = [];
                    //put files from fileList to Array
                    $.each(files, function (index, file) {
                        config.inputFileList.push(file);
                    });

                    config.fileListAdd = [];
                    config.filteredFilesToAdd = [];           
                    ExtensionsValidate(config.inputFileList);                              
                    FilesSizeValidate(config.inputFileList);                           
                    limitFilesErrorShow();                   
                    DisplayFiles(config.fileListAdd, config.filteredFilesToAdd);
                }

                // add li with the file name, image and progress bar  
                function DisplayFiles(files, filteredFilesAdd) {
                    files = files.concat(filteredFilesAdd);
                    $.each(files, function (i, file) {
                        countImg++;
                        var parts = file.type.split('/');
                        // add li with the file name, image and progress bar                        
                        var li = $('<li class="img-block"/>').appendTo(imgList);
                        li.attr("name", file.name);
                        li.attr("size", file.size);
                        //div with name of the file           
                        $('<button class="img-delete" data-name="' + file.name + '" data-size="' + file.size + '"/>').appendTo(li);
                        if(file.type.indexOf('image')>=0){
                            var img = $('<canvas class="img-photo-block" id="img-id-' + countImg + '"></canvas>').appendTo(li);
                        }                      
                        else{
                            var img = $('<div class="img-photo-block img-photo-block-doc" id="img-id-' + countImg + '"></div>').appendTo(li);
                        }

                        if (file.size > config.maxFileSize) {
                            img.addClass('img-photo-block-error');
                        } else {
                            //main picture link                          
                            if(config.addToMainLink && file.type.indexOf('image')>=0){                              
                                $('<div class="main-picture-block"><a href="#" class="main-picture-link" data-name="' + file.name + '">Add to main</a></div>').appendTo(li);
                            }
                        }
                        li.get(0).file = file;

                        if(file.type.indexOf('image')>=0){
                            var c = document.getElementById("img-id-" + countImg);
                            var ctx = c.getContext("2d");
                            var img = new Image();
                            img.src = URL.createObjectURL(file);
                            img.onload = function () {
                                ctx.drawImage(img, 0, 0, 302, 184);
                            }
                        }
                    });
                    if (config.filteredFiles.length == 0) {                       
                        hideError(config.limitImgErrorClass);
                    }

                    if (config.fileList.length < config.maxCountFiles) {
                        hideError(config.limitCountErrorClass);
                    }
                }

                //eventlistner for delete element from list
                $('body').on('click', '.img-delete', function (e) {
                    e.preventDefault();
                    RemoveFileFromList($(this).attr('data-name'), $(this).attr('data-size'));

                });

                //add to main listener
                $('body').on('click','.main-picture-link',function(e){
                    e.preventDefault();
                    mainPictureInput.val($(this).attr('data-name'));
                });

                ///Removes file from the preview list and fileList
                function RemoveFileFromList(fileName, fileSize) {
                    $('li[name="' + fileName + '"][size=' + fileSize + ']').remove();
                    $.each(config.fileList, function (index, file) {
                        if (file.name == fileName && file.size == fileSize) {
                            config.fileList.splice(config.fileList.indexOf(file), 1);
                            return false;
                        }
                    });
                    $.each(config.filteredFiles, function (index, file) {
                        if (file.name == fileName && file.size == fileSize) {
                            config.filteredFiles.splice(config.filteredFiles.indexOf(file), 1);
                            return false;
                        }
                    });
                    if (config.filteredFiles.length == 0) {
                        hideError(config.limitImgErrorClass);
                    }

                    if (config.fileList.length < config.maxCountFiles) {
                        hideError(config.limitCountErrorClass);
                    }

                }


                //validators
                //file size validatr
                 function FilesSizeValidate(files) {
                    var freePlaces = config.maxCountFiles - config.fileList.length;
                    config.fileListAdd = [];
                    $.each(files, function (index, file) {
                        if (file.size > config.maxFileSize) {
                            if (!isContainsFile(config.filteredFiles, file)) {
                                config.filteredFiles.push(file);
                                config.filteredFilesToAdd.push(file);
                            }
                        } else {
                            if (freePlaces == 0) //if we have no free places but still able to show extra BIG files
                            {
                                showError(config.limitCountErrorClass);
                                freePlaces--;
                                return true;
                            }
                           
                            if (!isContainsFile(config.fileList, file) && freePlaces > 0) //if file is new and we have place for it  
                            {                             
                                freePlaces--;
                                config.fileListAdd.push(file);
                                config.fileList.push(file);
                            }
                        }
                    });                 
                }

                //removes files from entered file collection, wich are not match the extension list
                function ExtensionsValidate(files) {

                    var tmpFiles = [];
                    var parts = [];
                    //if file's extension does not match the extension list - do not add it to fileList or filteredFiles
                    //end remove it from entered (given to function) file list
                    $.each(files, function (index, file) {
                        tmpFiles.push(file);
                        var ext = file.name.split(".").pop();
                        parts = file.type.split('/');                       
                        if (config.filesExt.join().search(ext) == -1 || (parts.length == 1 && parts[0] == '') /*couldn't determine the type*/) {
                            tmpFiles.splice($.inArray(file, tmpFiles), 1);
                        }
                    });                    
                    config.inputFileList = tmpFiles;
                }


                //if files in fileList are enough - do not process them
                function MaxFilesQuantityValidate(files) {
                    if (config.fileList.length + files.length > config.maxCountFiles) {
                        showError(config.limitCountErrorClass);
                        return false;
                    }
                    return true;
                }

                ///indicates if fileList contains some file
                function ContainsFile(element, index, array) {
                    if (this.name == element.name && this.size == element.size && this.name !== undefined) {
                        return true;
                    }
                    return false;
                }

                //check added file
                function isContainsFile(arr, file) {  
                    var res=false;                                      
                    $.each(arr,
                        function () {
                            if (file.name === this.name &&
                                file.size === this.size &&
                                file.name !== undefined) {                                   
                                    res= true;                                
                            }                           
                        });                   
                    return   res;
                }

                //errors
                function limitFilesErrorShow() {
                    if (config.filteredFiles.length > 0) {
                        showError(config.limitImgErrorClass);
                    }
                }

                function showError(classError) {                    
                    $('.' + classError).css('display', 'block');
                }

                function hideError(classError) {                   
                    $('.' + classError).css('display', 'none');
                }

            });

        },


    };


    $.fn.fileuploader = function (method) {
        // logic call methods
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' not exist');
        }
    };

}(jQuery, document));
