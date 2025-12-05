Новый вариант (более кастомизируемый)

<div class="file-upload">
     <label>
          <input type="file" name="file" multiple>
          <span>Выбрать файл</span>
     </label>
</div>
<!--Вывод названия файла-->
<p id="filename" class="filename">Файл не выбран</p>

Код js (для перевода сообщений всавить на нужную страницу шаблона)

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.querySelector('.file-upload input[type=file]');
    const filenameElement = document.getElementById('filename');

    fileInput.addEventListener('change', function() {
        const files = this.files;

        if (files.length === 1) {
            const filename = files[0].name;
            filenameElement.textContent = filename;
        } else if (files.length > 1) {
            filenameElement.textContent = `Выбрано ${files.length} файлов`;
        } else {
            filenameElement.textContent = 'Файл не выбран';
        }
    });
});
