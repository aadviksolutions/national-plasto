with open(r'C:\Users\acer\.gemini\antigravity-ide\brain\7edd0d34-7ccf-47a0-809f-a5deb3f4b73e\.system_generated\steps\256\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pos = text.find('social_links')
if pos != -1:
    print(text[pos-50:pos+1000])
