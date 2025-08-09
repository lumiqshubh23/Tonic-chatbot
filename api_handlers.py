"""
API handlers for TONIC AI Assistant
"""

import openai
import google.generativeai as genai
import requests
import logging
import os
from utils import PERPLEXITY_API_KEY, PERPLEXITY_API_URL, logger

# Configure API clients
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except KeyError:
    logger.error("API keys not found in environment variables")

def extract_structured_info(text, filename):
    """Extract structured information using Gemini with table formatting instructions"""
    base_prompt = """Extract structured information from this document for building a knowledge base.
    
    IMPORTANT: When presenting tabular data, please format it as a proper HTML table using <table>, <tr>, <td>, <th> tags.
    For example:
    <table>
    <tr><th>Column 1</th><th>Column 2</th></tr>
    <tr><td>Data 1</td><td>Data 2</td></tr>
    </table>
    
    Alternatively, you can use markdown table format:
    | Column 1 | Column 2 |
    |----------|----------|
    | Data 1   | Data 2   |
    
    Document content: """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        # Limit text to prevent token limit issues
        text_chunk = text[:30000]
        gemini_response = model.generate_content(base_prompt + text_chunk)
        structured_output = gemini_response.text
        logger.info(f"Extracted structured data from {filename}")
        return structured_output
    except Exception as e:
        logger.error(f"Gemini failed on {filename}: {e}")
        return ""

def generate_plot_code(knowledge, query, reply):
    """Generate matplotlib code for visualization"""
    system_prompt = "You are a Python assistant. Output only valid matplotlib code using data given to you. You can generate multiple plots, so generate code in that way. If there is no sufficient Knowledge Base data, rely on the Answer"
    user_prompt = f"""Knowledge Base:\n{knowledge}\n\nUser Query:\n{query}\n\nAnswer:\n{reply}"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        from utils import extract_code
        return extract_code(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Code generation failed: {e}")
        return None

def get_gemini_response(prompt, conversation_history=None):
    """Get response from Gemini with conversation context"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Build conversation context
        if conversation_history:
            context = "Previous conversation:\n"
            for i, msg in enumerate(conversation_history[-5:]):  # Last 5 messages for context
                context += f"User: {msg['q']}\nAssistant: {msg['a']}\n\n"
            
            full_prompt = context + "Current question:\n" + prompt
        else:
            full_prompt = prompt
            
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return f"❌ Gemini error: {e}"
    
def get_openai_response(prompt, conversation_history=None):
    """
    Get response from OpenAI chat model using `openai_client.chat.completions.create`.
    Supports conversation history (last 5 turns).
    """
    try:
        messages = []

        # Add past messages if available
        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["q"]})
                messages.append({"role": "assistant", "content": turn["a"]})

        # Append the current prompt
        messages.append({"role": "user", "content": prompt})

        # Create the completion
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return f"❌ OpenAI error: {e}"

def get_perplexity_response(prompt, conversation_history=None, model="sonar"):
    """
    Get response from Perplexity API with optional conversation history.
    """
    try:
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        # Build OpenAI-style messages
        messages = []

        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": "user", "content": turn["q"]})
                messages.append({"role": "assistant", "content": turn["a"]})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "stream": False
        }

        response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload)

        if response.ok:
            # Extract citation metadata if present
            citations = ""
            for j in response.json()["search_results"]:
                tmp_c = j.get('title') + " - " + j.get('url')
                print(tmp_c)
                citations = citations + tmp_c + " \n "
            
            return response.json()["choices"][0]["message"]["content"], citations

        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return f"❌ Perplexity error: {response.status_code}: {response.text}", ""

    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"❌ Perplexity error: {e}", ""

def get_chat_prompt():
    """Get the base chat prompt for the AI assistant"""
    return (
        "You are an intelligent assistant. Use the extracted knowledge base if it's available to answer user queries. "
        "In addition, rely on your own knowledge whenever needed, based on the user's input. "
        "If the answer cannot be found in the knowledge base, use your general understanding to respond.\n\n"

        "IMPORTANT FORMATTING:\n"
        "- When presenting tabular data, format it as markdown tables using `|` symbols.\n"
        "- Example:\n"
        "  | Column 1 | Column 2 |\n"
        "  |----------|----------|\n"
        "  | Data 1   | Data 2   |\n\n"

        "**POINTS TO KEEP IN MIND:**\n"
        "- If the user requests Excel-like output, assume tabular format and provide markdown directly.\n"
        "  Mention that this product allows instant download of the generated table.\n"
        "- If the user requests graphs, plots, or charts, do not generate them. "
        "A separate module in the system handles visualizations.\n"
        "- If relevant information isn't found in the knowledge base, use your own understanding to answer accurately.\n"
        "- Always consider the user input carefully. Combine it with the knowledge base and your knowledge to generate accurate and context-aware responses.\n"
        "- Maintain conversational context by referring to previous user queries where appropriate. If the query is entirely new, don't use previous knowledge.\n\n"

        "**SPECIAL FORMAT — MEDIA PLAN REQUESTS:**\n"
        "- If the user asks for a *media plan* or requests *marketing metrics across platforms*, present the data in TONIC-style format.\n"
        "- TONIC-style table format:\n"
        "  1. Start with a title (e.g., 'Plan KSA') on top.\n"
        "  2. First table row = main metric headers: Medium, Clicks, CPC, Impressions, CPM, Views, CPV, CTR, Leads, CPL, Total Cost.\n"
        "  3. Second row = subheaders (e.g., Channel, Exp. Link Clicks, etc.).\n"
        "  4. List each platform (e.g., TikTok, YouTube) in a row with corresponding metrics.\n"
        "  5. At the bottom, include summary rows: Net Total, Total Clicks, Impressions, Views, etc.\n"
        "  6. Format the entire table in markdown using `|`, just like other tables.\n"
        "  7. Do not explain the table — output the TONIC table directly with any other requested info (like recommendations or insights).\n"
        "- Example:\n"
        "\n"
        "  Plan KSA  \n"
        "  | Medium | Clcks | CPC | Impressions | CPM | Views | CPV | CTR | Leads | CPL | Total Cost |\n"
        "  | Channel | Exp. Link Clicks | Exp. Tonic CPC | Exp. Impressions | Exp. Tonic CPM | Video Views | Exp. Tonic CPV | Exp.CTR | | Budget |\n"
        "  | Tiktok Ad | 11,630 | AED1.29 | 2,907,540 | AED5.16 | 67,843 | AED0.22 | 0.40 | 150 | 100 | 15000 |\n"
        "  | Facebook/Instagram | 18,367 | AED1.47 | 6,679,035 | AED4.04 | 734,694 | AED0.04 | 0.28 | 270 | 100 | 27000 |\n"
        "  | Twitter X | 4,511 | AED1.40 | 1,051,709 | AED5.99 | 11,429 | AED0.55 | 0.43 | 63 | 100 | 6300 |\n"
        "  | YouTube Ads | 5,630 | AED2.13 | 806,248 | AED14.88 | 544,218 | AED0.02 | 0.70 | 120 | 100 | 12000 |\n"
        "  | Search Ads | 5,246 | AED2.21 |  |  |  |  |  | 116 | 100 | 11600 |\n"
        "  | Google Display Ads | 7,850 | AED1.03 | 2,448,980 | AED3.31 | NA | NA | 0.32 | 81 | 100 | 8100 |\n"
        "  | | | | | | | | | | | |\n"
        "  | | | | | | | | Net Total | AED80,000 | | |\n"
        "  | | | | | | | | Total Clicks | 53,235 | | |\n"
        "  | | | | | | | | Total Impressions | 13,893,513 | | |\n"
        "  | | | | | | | | Total Views | 1,358,183 | | |\n\n"

        "- Use this format **only** if the user's query is about media planning, digital ad performance, or channel-level budget/performance comparison.\n"

        "- Also provide list of sources/URLs as Sources:\n"
        "  from where you have gathered all the data (list no more than 5)\n"
        "  - ALSO NEVER LIST ANY SOURCES RELATED TO FORMATTING, ETC. LIST ONLY DATA SOURCES"
    )
