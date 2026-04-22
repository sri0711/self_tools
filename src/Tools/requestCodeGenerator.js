export const generateRequestCode = (
	language,
	method,
	finalUrl,
	finalHeaders,
	body,
	bodyType = 'raw',
	formDataParams = []
) => {
	const methodUpper = method.toUpperCase();
	let cleanedHeaders = { ...finalHeaders };

	if (bodyType === 'formdata') {
		Object.keys(cleanedHeaders).forEach((k) => {
			if (k.toLowerCase() === 'content-type') delete cleanedHeaders[k];
		});
	}

	const headerEntries = Object.entries(cleanedHeaders);

	switch (language) {
		case 'curl': {
			let cmd = `curl -X ${methodUpper} "${finalUrl}"`;
			headerEntries.forEach(([k, v]) => {
				cmd += ` \\\n  -H "${k}: ${v}"`;
			});

			if (bodyType === 'formdata') {
				formDataParams.forEach((p) => {
					if (p.key) {
						if (p.type === 'file' && p.file) {
							cmd += ` \\\n  -F "${p.key}=@${p.file.name}"`;
						} else {
							cmd += ` \\\n  -F "${p.key}=${p.value}"`;
						}
					}
				});
			} else if (body) {
				cmd += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
			}
			return cmd;
		}
		case 'fetch': {
			let prep = '';
			let fetchOpts = `{\n  method: "${methodUpper}",\n`;
			if (headerEntries.length) {
				fetchOpts += `  headers: ${JSON.stringify(cleanedHeaders, null, 2).replace(/\n/g, '\n  ')},\n`;
			}

			if (bodyType === 'formdata') {
				prep = `const formData = new FormData();\n`;
				formDataParams.forEach((p) => {
					if (p.key) {
						prep += `formData.append("${p.key}", ${p.type === 'file' ? `fileInput.files[0]` : `"${p.value}"`});\n`;
					}
				});
				fetchOpts += `  body: formData\n`;
			} else if (body) {
				fetchOpts += `  body: JSON.stringify(${body})\n`;
			}
			fetchOpts += `}`;
			return `${prep ? prep + '\n' : ''}fetch("${finalUrl}", ${fetchOpts})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));`;
		}
		case 'axios': {
			let prep = '';
			let axiosOpts = `{\n  method: '${methodUpper.toLowerCase()}',\n  url: '${finalUrl}',\n`;
			if (headerEntries.length) {
				axiosOpts += `  headers: ${JSON.stringify(cleanedHeaders, null, 2).replace(/\n/g, '\n  ')},\n`;
			}

			if (bodyType === 'formdata') {
				prep = `const formData = new FormData();\n`;
				formDataParams.forEach((p) => {
					if (p.key) {
						prep += `formData.append("${p.key}", ${p.type === 'file' ? `fileInput.files[0]` : `"${p.value}"`});\n`;
					}
				});
				axiosOpts += `  data: formData\n`;
			} else if (body) {
				axiosOpts += `  data: ${body}\n`;
			}
			axiosOpts += `}`;
			return `${prep ? prep + '\n' : ''}axios(${axiosOpts})\n  .then(function (response) {\n    console.log(response.data);\n  })\n  .catch(function (error) {\n    console.error(error);\n  });`;
		}
		case 'python': {
			let py = `import requests\n\nurl = "${finalUrl}"\n`;
			if (headerEntries.length) {
				py += `headers = ${JSON.stringify(finalHeaders, null, 4)}\n`;
			}
			if (bodyType === 'formdata') {
				py += `\n# Note: Multipart FormData generator mapping is simplified.\n# Please use the 'requests' files parameter manually for binary streams.\npayload = {}\n`;
			} else if (body) {
				py += `payload = ${body}\n`;
			}
			py += `\nresponse = requests.request("${methodUpper}", url`;
			if (headerEntries.length) py += `, headers=headers`;
			if (body) py += `, data=payload`;
			py += `)\n\nprint(response.text)`;
			return py;
		}
		case 'java': {
			let java = `OkHttpClient client = new OkHttpClient();\n\n`;
			if (body) {
				java += `MediaType mediaType = MediaType.parse("application/json");\n`;
				java += `RequestBody body = RequestBody.create(mediaType, "${body.replace(/"/g, '\\"')}");\n`;
			}
			java += `Request request = new Request.Builder()\n  .url("${finalUrl}")\n`;
			if (methodUpper !== 'GET') {
				java += `  .${methodUpper.toLowerCase()}(${body ? 'body' : 'null'})\n`;
			}
			headerEntries.forEach(([k, v]) => {
				java += `  .addHeader("${k}", "${v}")\n`;
			});
			java += `  .build();\n\n`;
			java += `Response response = client.newCall(request).execute();`;
			return java;
		}
		case 'rust': {
			let rust = `let client = reqwest::Client::new();\n`;
			rust += `let res = client.${methodUpper.toLowerCase()}("${finalUrl}")\n`;
			headerEntries.forEach(([k, v]) => {
				rust += `    .header("${k}", "${v}")\n`;
			});
			if (body) {
				rust += `    .body(r#"${body}"#)\n`;
			}
			rust += `    .send()\n    .await?;\n`;
			return rust;
		}
		case 'go': {
			let go = `package main\n\nimport (\n\t"fmt"\n\t"strings"\n\t"net/http"\n\t"io"\n)\n\nfunc main() {\n`;
			go += `\turl := "${finalUrl}"\n\tmethod := "${methodUpper}"\n\n`;
			if (body) {
				go += `\tpayload := strings.NewReader(\`${body.replace(/`/g, '`+"`"+`')}\`)\n\n`;
				go += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, payload)\n\n`;
			} else {
				go += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, nil)\n\n`;
			}
			go += `\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n`;
			headerEntries.forEach(([k, v]) => {
				go += `\treq.Header.Add("${k}", "${v}")\n`;
			});
			go += `\n\tres, err := client.Do(req)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tdefer res.Body.Close()\n\n`;
			go += `\tbody, err := io.ReadAll(res.Body)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tfmt.Println(string(body))\n}`;
			return go;
		}
		case 'csharp': {
			let cs = `var client = new HttpClient();\n`;
			cs += `var request = new HttpRequestMessage(HttpMethod.${methodUpper.charAt(0) + methodUpper.slice(1).toLowerCase()}, "${finalUrl}");\n`;
			headerEntries.forEach(([k, v]) => {
				cs += `request.Headers.Add("${k}", "${v}");\n`;
			});
			if (body) {
				cs += `var content = new StringContent("${body.replace(/"/g, '\\"')}", null, "text/plain");\n`;
				cs += `request.Content = content;\n`;
			}
			cs += `var response = await client.SendAsync(request);\n`;
			cs += `response.EnsureSuccessStatusCode();\n`;
			cs += `Console.WriteLine(await response.Content.ReadAsStringAsync());`;
			return cs;
		}
		case 'php': {
			let php = `<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, array(\n`;
			php += `  CURLOPT_URL => '${finalUrl}',\n`;
			php += `  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_ENCODING => '',\n  CURLOPT_MAXREDIRS => 10,\n  CURLOPT_TIMEOUT => 0,\n  CURLOPT_FOLLOWLOCATION => true,\n  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n`;
			php += `  CURLOPT_CUSTOMREQUEST => '${methodUpper}',\n`;
			if (body) {
				php += `  CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',\n`;
			}
			if (headerEntries.length) {
				php += `  CURLOPT_HTTPHEADER => array(\n`;
				headerEntries.forEach(([k, v]) => {
					php += `    '${k}: ${v}',\n`;
				});
				php += `  ),\n`;
			}
			php += `));\n\n$response = curl_exec($curl);\n\ncurl_close($curl);\necho $response;`;
			return php;
		}
		case 'ruby': {
			let rb = `require "uri"\nrequire "net/http"\n\n`;
			rb += `url = URI("${finalUrl}")\n\n`;
			rb += `https = Net::HTTP.new(url.host, url.port)\nhttps.use_ssl = true\n\n`;
			rb += `request = Net::HTTP::${methodUpper.charAt(0) + methodUpper.slice(1).toLowerCase()}.new(url)\n`;
			headerEntries.forEach(([k, v]) => {
				rb += `request["${k}"] = "${v}"\n`;
			});
			if (body) {
				rb += `request.body = "${body.replace(/"/g, '\\"')}"\n`;
			}
			rb += `\nresponse = https.request(request)\nputs response.read_body`;
			return rb;
		}
		case 'swift': {
			let sw = `import Foundation\n\n`;
			sw += `var request = URLRequest(url: URL(string: "${finalUrl}")!,timeoutInterval: Double.infinity)\n`;
			headerEntries.forEach(([k, v]) => {
				sw += `request.addValue("${v}", forHTTPHeaderField: "${k}")\n`;
			});
			sw += `\nrequest.httpMethod = "${methodUpper}"\n`;
			if (body) {
				sw += `request.httpBody = "${body.replace(/"/g, '\\"')}".data(using: .utf8)\n`;
			}
			sw += `\nlet task = URLSession.shared.dataTask(with: request) { data, response, error in\n`;
			sw += `  guard let data = data else {\n    print(String(describing: error))\n    return\n  }\n`;
			sw += `  print(String(data: data, encoding: .utf8)!)\n}\n\ntask.resume()`;
			return sw;
		}
		case 'powershell': {
			let ps = `$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"\n`;
			headerEntries.forEach(([k, v]) => {
				ps += `$headers.Add("${k}", "${v}")\n`;
			});
			if (body) {
				ps += `\n$body = "${body.replace(/"/g, '`"')}"\n`;
			}
			ps += `\n$response = Invoke-RestMethod '${finalUrl}' -Method '${methodUpper}' -Headers $headers`;
			if (body) {
				ps += ` -Body $body`;
			}
			ps += `\n$response | ConvertTo-Json`;
			return ps;
		}
		default:
			return '';
	}
};
