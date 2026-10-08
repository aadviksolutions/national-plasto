with open(r'C:\Users\acer\.gemini\antigravity-ide\brain\7edd0d34-7ccf-47a0-809f-a5deb3f4b73e\.system_generated\steps\1399\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('class="contact_us"')
if idx != -1:
    end_idx = text.find('</section>', idx)
    with open('scratch/supreme_contact.html', 'w', encoding='utf-8') as out:
        out.write(text[idx-9:end_idx+10])
    print('Wrote scratch/supreme_contact.html')
else:
    print('Not found')
