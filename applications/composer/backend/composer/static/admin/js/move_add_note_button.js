(function() {
    // Wait for Django admin to load
    function initializeNotesMover() {
        if (typeof django !== 'undefined' && django.jQuery) {
            var $ = django.jQuery;
            
            $(document).ready(function() {
                // Wait a bit for the admin interface to fully load
                setTimeout(function() {
                    console.log('Looking for notes inline section...');
                    
                    // Try multiple selectors to find the notes section
                    var notesInline = null;
                    
                    // First try: look for inline-group with notes in header
                    $('.inline-group').each(function() {
                        var $this = $(this);
                        var header = $this.find('h2').text();
                        console.log('Found inline group with header:', header);
                        if (header.toLowerCase().includes('note')) {
                            notesInline = $this;
                            console.log('Found notes inline section');
                            return false; // break
                        }
                    });
                    
                    // Second try: look by form prefix (notes-)
                    if (!notesInline) {
                        $('fieldset.module').each(function() {
                            var $this = $(this);
                            var inputs = $this.find('input[name*="notes-"]');
                            if (inputs.length > 0) {
                                notesInline = $this;
                                console.log('Found notes section by form prefix');
                                return false; // break
                            }
                        });
                    }
                    
                    // Third try: look for any fieldset containing note-related forms
                    if (!notesInline) {
                        $('div[class*="inline"]').each(function() {
                            var $this = $(this);
                            if ($this.find('textarea').length > 0) {
                                var forms = $this.find('input[name*="-note"]');
                                if (forms.length > 0) {
                                    notesInline = $this;
                                    console.log('Found notes section by textarea and note forms');
                                    return false; // break
                                }
                            }
                        });
                    }
                    
                    if (notesInline && notesInline.length) {
                        console.log('Notes section found, moving add button...');
                        moveAddButtonToTop(notesInline);
                    } else {
                        console.log('Could not find notes inline section');
                        // Debug: show all inline groups
                        $('.inline-group, fieldset.module, div[class*="inline"]').each(function(i) {
                            console.log('Available section ' + i + ':', $(this).find('h2, legend').text());
                        });
                    }
                }, 1500);
            });
            
            function moveAddButtonToTop(notesInline) {
                console.log('moveAddButtonToTop called with:', notesInline);
                
                var addButton = notesInline.find('.add-row');
                var title = notesInline.find('h2, legend, .module h2').first();
                
                console.log('Add button found:', addButton.length);
                console.log('Title found:', title.length, title.text());
                
                if (addButton.length > 0) {
                    console.log('Moving add button to top...');
                    
                    // If no title found, insert at the beginning of the section
                    if (title.length > 0) {
                        addButton.detach().insertAfter(title);
                    } else {
                        addButton.detach().prependTo(notesInline);
                    }
                    
                    // Add some styling to make it more prominent at the top
                    addButton.css({
                        'margin-bottom': '10px',
                        'border': '1px dashed #ccc',
                        'padding': '10px',
                        'background-color': '#f9f9f9'
                    });
                    
                    console.log('Add button moved and styled');
                    
                    // Override the default add behavior to add new forms at the top
                    addButton.find('a').off('click').on('click', function(e) {
                        e.preventDefault();
                        console.log('Add button clicked');
                        addNewNoteAtTop(notesInline);
                    });
                } else {
                    console.log('No add button found in notes section');
                    // Debug: show what's in the section
                    console.log('Section contents:', notesInline.html());
                }
            }
            
            function addNewNoteAtTop(notesInline) {
                console.log('addNewNoteAtTop called');
                
                // Get form management details
                var totalFormsInput = notesInline.find('input[name$="-TOTAL_FORMS"]');
                var totalForms = parseInt(totalFormsInput.val());
                var prefix = totalFormsInput.attr('name').replace('-TOTAL_FORMS', '');
                
                console.log('Total forms:', totalForms, 'Prefix:', prefix);
                
                // Find existing forms to use as template
                var existingForms = notesInline.find('.inline-related:not(.empty-form)');
                var addButton = notesInline.find('.add-row');
                
                console.log('Existing forms found:', existingForms.length);
                
                if (existingForms.length > 0) {
                    // Clone the first existing form as template
                    var templateForm = existingForms.first().clone(true);
                    
                    console.log('Cloned template form');
                    
                    // Thoroughly clear all form elements and their states
                    templateForm.find('input, textarea, select').each(function() {
                        var $this = $(this);
                        var inputType = $this.attr('type');
                        
                        if (inputType === 'checkbox' || inputType === 'radio') {
                            $this.prop('checked', false);
                            $this.removeAttr('checked');
                        } else if (inputType === 'hidden' && $this.attr('name') && $this.attr('name').includes('DELETE')) {
                            // Keep DELETE fields unchecked for new forms
                            $this.val('');
                        } else if (inputType === 'hidden' && $this.attr('name') && $this.attr('name').includes('id')) {
                            // Clear ID fields for new forms
                            $this.val('');
                        } else if ($this.is('select')) {
                            // Clear select dropdowns completely
                            $this.prop('selectedIndex', -1);
                            $this.val('');
                            $this.find('option').prop('selected', false);
                            $this.find('option:first').prop('selected', true); // Select first (usually empty) option
                            $this.trigger('change'); // Trigger change event to update any dependent fields
                        } else {
                            // Clear text inputs, textareas, etc.
                            $this.val('');
                            $this.removeAttr('value');
                        }
                    });
                    
                    // Remove any error states
                    templateForm.removeClass('errors');
                    templateForm.find('.errorlist').remove();
                    templateForm.find('.error').removeClass('error');
                    
                    // Clear any autocomplete or chosen.js selections
                    templateForm.find('.select2-container').remove(); // Remove Select2 containers
                    templateForm.find('select').each(function() {
                        var $select = $(this);
                        if ($select.data('select2')) {
                            $select.select2('destroy');
                        }
                    });
                    
                    // Fix cosmetic issues for new form
                    // 1. Change the form title to "New Note"
                    templateForm.find('h3, .inline-related h3, .module h3').first().text('New Note');
                    
                    // 2. Clear the "created_at" display field (readonly field showing date)
                    templateForm.find('div.readonly').each(function() {
                        var $readonly = $(this);
                        var label = $readonly.find('label').text();
                        if (label && label.toLowerCase().includes('created')) {
                            $readonly.find('div:not(.label)').text(''); // Clear the date display
                        }
                    });
                    
                    // Also clear any input fields that might contain created_at
                    templateForm.find('input[name*="created_at"], input[name*="created"]').val('');
                    
                    // Update all name and id attributes with new form index
                    templateForm.find('*').each(function() {
                        var $this = $(this);
                        
                        // Update name attribute
                        var name = $this.attr('name');
                        if (name && name.includes(prefix)) {
                            var newName = name.replace(/-\d+-/, '-' + totalForms + '-');
                            $this.attr('name', newName);
                        }
                        
                        // Update id attribute
                        var id = $this.attr('id');
                        if (id && id.includes(prefix)) {
                            var newId = id.replace(/-\d+-/, '-' + totalForms + '-');
                            $this.attr('id', newId);
                        }
                        
                        // Update for attribute (labels)
                        var forAttr = $this.attr('for');
                        if (forAttr && forAttr.includes(prefix)) {
                            var newFor = forAttr.replace(/-\d+-/, '-' + totalForms + '-');
                            $this.attr('for', newFor);
                        }
                    });
                    
                    // Add a visual indicator that this is a new form
                    templateForm.css({
                        'border': '2px solid #4CAF50',
                        'background-color': '#f0fff0',
                        'margin-bottom': '10px'
                    });
                    
                    // Insert the new form right after the add button (at the top)
                    addButton.after(templateForm);
                    
                    console.log('New form inserted after add button');
                    
                    // Update total forms count
                    totalFormsInput.val(totalForms + 1);
                    
                    // Reinitialize any Django admin widgets for the new form
                    setTimeout(function() {
                        // Reinitialize autocomplete fields
                        templateForm.find('select[data-autocomplete-light-url]').each(function() {
                            // Reinitialize django-autocomplete-light if present
                            if (window.django && django.jQuery && django.jQuery.fn.select2) {
                                $(this).select2();
                            }
                        });
                        
                        // Reinitialize any Select2 dropdowns
                        templateForm.find('select').each(function() {
                            var $select = $(this);
                            if (window.django && django.jQuery && django.jQuery.fn.select2) {
                                // Only initialize if not already initialized
                                if (!$select.data('select2')) {
                                    $select.select2({
                                        allowClear: true,
                                        placeholder: 'Select an option...'
                                    });
                                }
                            }
                        });
                        
                        // Focus on the first input field
                        var firstInput = templateForm.find('textarea, input[type="text"]:not([type="hidden"])').first();
                        if (firstInput.length) {
                            firstInput.focus();
                            console.log('Focused on first input field');
                        }
                    }, 200);
                    
                } else {
                    console.log('No existing forms found, using empty form template if available');
                    // Try to find and use the empty form template
                    var emptyForm = notesInline.find('.empty-form');
                    if (emptyForm.length === 0) {
                        // Look for Django's inline formset template
                        emptyForm = $(document).find('.empty-form').filter(function() {
                            return $(this).html().includes(prefix);
                        });
                    }
                    
                    if (emptyForm.length > 0) {
                        var newForm = emptyForm.clone();
                        newForm.removeClass('empty-form');
                        newForm.show();
                        
                        // Replace __prefix__ placeholders
                        var formHtml = newForm.html();
                        formHtml = formHtml.replace(/__prefix__/g, totalForms);
                        newForm.html(formHtml);
                        
                        // Update attributes
                        newForm.find('*').each(function() {
                            var $this = $(this);
                            $.each(this.attributes, function() {
                                if (this.value && this.value.includes('__prefix__')) {
                                    this.value = this.value.replace(/__prefix__/g, totalForms);
                                }
                            });
                        });
                        
                        // Insert after add button
                        addButton.after(newForm);
                        totalFormsInput.val(totalForms + 1);
                        
                        console.log('Used empty form template');
                    } else {
                        alert('Please add at least one note first, then you can add more at the top.');
                    }
                }
            }
            
        } else {
            // Fallback: wait for django.jQuery to be available
            setTimeout(initializeNotesMover, 100);
        }
    }
    
    // Initialize when the script loads
    initializeNotesMover();
})();
