$(function () {
  $('#emailList').on('click', '.removeEmail', function (e) {
    e.preventDefault()
    $(this).closest('li').remove()
  })
  $('#addEmail').on('click', function (e) {
    e.preventDefault()
    var s = '<li><input type="text" name="emails[]"> <a href="#" class="removeEmail">(-)</a></li>'
    $('#emailList').append(s)
  })

  $('#phoneList').on('click', '.removePhone', function (e) {
    e.preventDefault()
    $(this).closest('li').remove()
  })
  $('#addPhone').on('click', function (e) {
    e.preventDefault()
    var s = '<li><input type="text" name="phoneNum[]"> ' +
            '<select name="phoneType[]">';
    ['', 'Work', 'Home', 'Mobile', 'Fax'].forEach(function (item) {
      s += '<option value="' + item + '">' + item + '</option>'
    })
    s += '</select> <a href="#" class="removePhone">(-)</a></li>'
    $('#phoneList').append(s)
  })
})
