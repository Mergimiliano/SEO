import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
import urllib3
import csv
import os
from flask import Flask, request, jsonify, send_file

# Disable SSL warnings (not recommended for production)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

def get_serp_results(keyword):
    """Fetch SERP results from Google for a given keyword."""
    url = f"https://www.google.com/search?q={keyword}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []
        for div in soup.find_all('div', class_='tF2Cxc'):
            link = div.find('a')['href']
            if link and 'https://' in link:
                parsed_url = urlparse(link)
                clean_url = urlunparse((parsed_url.scheme, parsed_url.netloc, parsed_url.path, '', '', ''))
                results.append(clean_url)
        return results[:10]
    else:
        print(f"Error: {response.status_code}")
        return []

def analyze_page(url):
    """Analyze a page to extract title, meta description, and headings."""
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, verify=False)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        title = soup.title.string if soup.title else "No title"

        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc["content"] if meta_desc else "No description"

        h1_headings = [h.get_text(strip=True) for h in soup.find_all('h1')]
        h2_headings = [h.get_text(strip=True) for h in soup.find_all('h2')]
        h3_headings = [h.get_text(strip=True) for h in soup.find_all('h3')]
        h4_headings = [h.get_text(strip=True) for h in soup.find_all('h4')]
        h5_headings = [h.get_text(strip=True) for h in soup.find_all('h5')]
        h6_headings = [h.get_text(strip=True) for h in soup.find_all('h6')]

        return {
            "url": url,
            "title": title,
            "lunghezza title": len(title),
            "description": description,
            "lunghezza description": len(description),
            "h1": "\n".join(h1_headings),
            "tot h1": len(h1_headings),
            "h2": "\n".join(h2_headings),
            "tot h2": len(h2_headings),
            "h3": "\n".join(h3_headings),
            "tot h3": len(h3_headings),
            "h4": "\n".join(h4_headings),
            "tot h4": len(h4_headings),
            "h5": "\n".join(h5_headings),
            "tot h5": len(h5_headings),
            "h6": "\n".join(h6_headings),
            "tot h6": len(h6_headings),
        }
    else:
        print(f"Error: {response.status_code} for {url}")
        return None

def keyword_density(url, keyword):
    """Calculate keyword density for a given keyword on a page."""
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, verify=False)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        text = soup.get_text(separator=" ").lower()

        words = re.findall(r'\w+', text)
        total_words = len(words)
        keyword_count = words.count(keyword.lower())

        density = (keyword_count / total_words) * 100 if total_words > 0 else 0

        return {
            "total_words": total_words,
            "keyword_count": keyword_count,
            "keyword_density": round(density, 2)
        }
    else:
        print(f"Error: {response.status_code} for {url}")
        return None

def write_to_csv(data, filename='results.csv'):
    """Write results to a CSV file."""
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        fieldnames = [
            "url", "title", "lunghezza title", "description", "lunghezza description",
            "h1", "tot h1", "h2", "tot h2", "h3", "tot h3", "h4", "tot h4",
            "h5", "tot h5", "h6", "tot h6", "total_words", "keyword_count", "keyword_density"
        ]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(row)
    return filename

@app.route('/get_csv', methods=['POST'])
def get_csv():
    try:
        keyword_to_search = request.json.get('keyword_to_search')
        if not keyword_to_search:
            return jsonify({"error": "Missing 'keyword_to_search' parameter"}), 400

        urls = get_serp_results(keyword_to_search)
        print(f"Extracted URLs: {urls}")
        data = []
        for url in urls:
            page_data = analyze_page(url)
            if page_data:
                density_data = keyword_density(url, keyword_to_search)
                page_data["total_words"] = density_data["total_words"]
                page_data["keyword_count"] = density_data["keyword_count"]
                page_data["keyword_density"] = density_data["keyword_density"]
                data.append(page_data)

        # Generate CSV file
        output_file = write_to_csv(data)

        # Send the file for download as an attachment
        return send_file(
            output_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name='results.csv'  # Specify the filename for download
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
