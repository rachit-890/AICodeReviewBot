#!/usr/bin/env python3
import os
import sys
import time
import uuid

# Color codes
class Colors:
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    GRAY = '\033[90m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    BG_DARK = '\033[48;5;234m'

# Node styling helper
def get_node_str(name, status, desc):
    if status == 'active':
        color = Colors.BLUE + Colors.BOLD
        border = "╔" + "═"*38 + "╗\n" + f"║ {name:<36} ║\n" + "╚" + "═"*38 + "╝"
    elif status == 'success':
        color = Colors.GREEN + Colors.BOLD
        border = "┌" + "─"*38 + "┐\n" + f"│ {name:<36} │\n" + "└" + "─"*38 + "┘"
    elif status == 'error':
        color = Colors.RED + Colors.BOLD
        border = "┌" + "─"*38 + "┐\n" + f"│ {name:<36} │\n" + "└" + "─"*38 + "┘"
    else:
        color = Colors.GRAY
        border = "┌" + "─"*38 + "┐\n" + f"│ {name:<36} │\n" + "└" + "─"*38 + "┘"
    
    lines = border.split('\n')
    colorized_lines = [f"{color}{line}{Colors.RESET}" for line in lines]
    return colorized_lines

# Source code templates
code_data = {
    'trigger': {
        'webhook': """@PostMapping("/github")
public ResponseEntity<Map<String, String>> handleGitHubWebhook(
        @RequestHeader("X-Hub-Signature-256") String sig,
        @RequestHeader("X-GitHub-Event") String event,
        @RequestBody String rawPayload) {
    // Processes webhook payload asynchronously
    webhookService.processWebhook(payload);
    return ResponseEntity.ok(Map.of("message", "Processing"));
}""",
        'rest': """@PostMapping("/review")
public ResponseEntity<ReviewResponse> review(
        @Valid @RequestBody ReviewRequest request) {
    // Synchronous PR metadata fetch and LLM evaluation
    GitHubPRData prData = gitHubService.fetchPRData(request.getPrUrl());
    ReviewResponse response = llmService.review(prData);
    return ResponseEntity.ok(response);
}"""
    },
    'auth': {
        'webhook': """public boolean verifySignature(String payload, String signature) {
    // Webhook secret security signature check
    Mac mac = Mac.getInstance("HmacSHA256");
    SecretKeySpec secretKey = new SecretKeySpec(
            webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    mac.init(secretKey);
    byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
    String expected = "sha256=" + HexFormat.of().formatHex(hash);
    return expected.equals(signature);
}""",
        'rest': """public ApiKeyValidationResult validate(String rawKey) {
    // O(1) indexed SHA-256 database lookup
    String hashedKey = hashKey(rawKey);
    Optional<ApiKey> key = apiKeyRepository
            .findByKeyHashAndActiveTrue(hashedKey);
    if (key.isEmpty()) return invalid("Invalid key");
    return valid(key.get().getClientName());
}"""
    },
    'ratelimit': {
        'all': """public boolean isAllowed(String clientId) {
    String key = "rate_limit:" + clientId;
    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1) {
        redisTemplate.expire(key, Duration.ofMinutes(1));
    }
    return count != null && count <= 10;
}"""
    },
    'cache': {
        'all': """private String buildCacheKey(String prUrl, String commitSha) {
    // Standardized MD5 hashing
    MessageDigest digest = MessageDigest.getInstance("MD5");
    byte[] hash = digest.digest(prUrl.getBytes(StandardCharsets.UTF_8));
    String urlHash = HexFormat.of().formatHex(hash);
    return "review_cache:" + urlHash + ":" + commitSha;
}"""
    },
    'llm': {
        'all': """public ReviewResponse review(GitHubPRData prData) {
    GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
            .apiKey(geminiApiKey)
            .modelName("gemini-1.5-flash") // Corrected model name
            .build();
    String prompt = buildPrompt(prData);
    String rawResponse = model.chat(prompt);
    return parseResponse(rawResponse, prData);
}"""
    },
    'db': {
        'all': """@Transactional
public Review saveReview(ReviewResponse response, String commit) {
    Review review = Review.builder()
            .prUrl(response.getPrUrl())
            .summary(response.getSummary())
            .overallScore(response.getOverallScore())
            .headCommitSha(commit)
            .build();
    return reviewRepository.save(review);
}"""
    },
    'response': {
        'webhook': """private void postReviewComment(WebhookPayload payload, ReviewResponse resp) {
    String comment = buildCommentBody(resp);
    webClient.post()
            .uri("/repos/{repo}/issues/{number}/comments", fullname, prNumber)
            .header("Authorization", "Bearer " + githubToken)
            .bodyValue(Map.of("body", comment))
            .retrieve()
            .bodyToMono(String.class)
            .block();
}""",
        'rest': """// Direct response returned in controller
return ResponseEntity.ok(response);"""
    }
}

def draw_arrow(color):
    return f"          {color}│{Colors.RESET}\n          {color}▼{Colors.RESET}"

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def get_status_color(status):
    if status == 'success':
        return Colors.GREEN
    if status == 'error':
        return Colors.RED
    if status == 'active':
        return Colors.BLUE
    return Colors.GRAY

def display_dashboard(active_node, states, mode, config, current_log, explanation):
    clear_screen()
    print(f"{Colors.BLUE}{Colors.BOLD}╔══════════════════════════════════════════════════════════════════════════╗{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}║           🤖 AI CODE REVIEW BOT INTERACTIVE TERMINAL FLOWCHART           ║{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}╚══════════════════════════════════════════════════════════════════════════╝{Colors.RESET}")
    
    # Render config
    print(f"{Colors.BOLD}Simulation Mode:{Colors.RESET} {Colors.CYAN}{mode.upper()}{Colors.RESET} | "
          f"{Colors.BOLD}Auth Valid:{Colors.RESET} {'Yes' if config['auth'] else 'No'} | "
          f"{Colors.BOLD}Rate Limit Allowed:{Colors.RESET} {'Yes' if config['ratelimit'] else 'No'} | "
          f"{Colors.BOLD}Cache Hit:{Colors.RESET} {'Yes' if config['cache'] else 'No'} | "
          f"{Colors.BOLD}Gemini Success:{Colors.RESET} {'Yes' if config['gemini'] else 'No'}\n")

    # Render Flowchart
    t_lines = get_node_str("1. Request Trigger [HTTP API / Webhook]", states['trigger'], "Entry point")
    a_lines = get_node_str("2. Security Filter [Signature / API Key]", states['auth'], "Auth Check")
    r_lines = get_node_str("3. Rate Limiter [Redis Counter]", states['ratelimit'], "Limit Check")
    c_lines = get_node_str("4. Review Cache [Redis MD5 Lookup]", states['cache'], "Cache Hit/Miss Check")
    l_lines = get_node_str("5. Gemini LLM [gemini-1.5-flash]", states['llm'], "AI Review")
    d_lines = get_node_str("6. DB Persistence [PostgreSQL]", states['db'], "Database Save")
    o_lines = get_node_str("7. Output Post [GitHub Comment / Response]", states['response'], "Exit point")

    # Flowchart layout with paths
    # Nodes are drawn sequentially with colored arrows
    arrow_t_a = draw_arrow(get_status_color(states['trigger']))
    arrow_a_r = draw_arrow(get_status_color(states['auth']))
    arrow_r_c = draw_arrow(get_status_color(states['ratelimit']))
    arrow_c_l = draw_arrow(get_status_color(states['cache']))
    arrow_l_d = draw_arrow(get_status_color(states['llm']))
    arrow_d_o = draw_arrow(get_status_color(states['db']))

    # Write out the flowchart structure
    for line in t_lines: print(f"  {line}")
    print(arrow_t_a)
    for line in a_lines: print(f"  {line}")
    print(arrow_a_r)
    for line in r_lines: print(f"  {line}")
    print(arrow_r_c)
    for line in c_lines: print(f"  {line}")
    
    if states['cache'] == 'success' and config['cache']:
        # Cache hit skip
        print(f"          {Colors.GREEN}│ (Cache Hit! Skip Gemini & DB){Colors.RESET}")
        print(f"          {Colors.GREEN}└──────────────────────────────┐{Colors.RESET}")
        print(f"                                         │")
        print(f"                                         ▼")
    else:
        print(arrow_c_l)
        for line in l_lines: print(f"  {line}")
        print(arrow_l_d)
        for line in d_lines: print(f"  {line}")
        print(arrow_d_o)
        
    for line in o_lines: print(f"  {line}")
    print()

    # Right side code visualization simulation
    print(f"{Colors.BLUE}{Colors.BOLD}--- Java Code Context for {active_node.upper()} ---{Colors.RESET}")
    # Get correct code
    comp_code = code_data[active_node]
    if 'webhook' in comp_code or 'rest' in comp_code:
        code_body = comp_code[mode]
    else:
        code_body = comp_code['all']
    
    # Print code body indented
    for line in code_body.split('\n'):
        print(f"  {Colors.GRAY}{line}{Colors.RESET}")
    print()

    # Print explanation and logs
    print(f"{Colors.BLUE}{Colors.BOLD}--- Step Details ---{Colors.RESET}")
    print(f"{Colors.CYAN}{explanation}{Colors.RESET}\n")

    print(f"{Colors.BLUE}{Colors.BOLD}--- Live Console Output ---{Colors.RESET}")
    for log in current_log[-6:]:
        print(f"  {log}")
    print()

def main():
    config = {
        'auth': True,
        'ratelimit': True,
        'cache': False,
        'gemini': True
    }
    mode = 'webhook'

    while True:
        clear_screen()
        print(f"{Colors.BLUE}{Colors.BOLD}================================================================{Colors.RESET}")
        print(f"{Colors.BLUE}{Colors.BOLD}        AI Code Review Bot - Terminal Flowchart Menu            {Colors.RESET}")
        print(f"{Colors.BLUE}{Colors.BOLD}================================================================{Colors.RESET}")
        print(f"1. Run Simulation (Current Settings)")
        print(f"2. Toggle Trigger Mode (Current: {Colors.CYAN}{mode.upper()}{Colors.RESET})")
        print(f"3. Toggle Security Auth Check (Current: {'VALID' if config['auth'] else 'INVALID'})")
        print(f"4. Toggle Rate Limiter Quota (Current: {'ALLOWED' if config['ratelimit'] else 'EXCEEDED'})")
        print(f"5. Toggle Redis Cache Check (Current: {'CACHE HIT' if config['cache'] else 'CACHE MISS'})")
        print(f"6. Toggle Gemini Model Status (Current: {'SUCCESS' if config['gemini'] else 'PARSE ERROR'})")
        print(f"7. Exit")
        print(f"================================================================")
        choice = input("Select an option (1-7): ").strip()

        if choice == '7':
            print("Exiting...")
            break
        elif choice == '2':
            mode = 'rest' if mode == 'webhook' else 'webhook'
        elif choice == '3':
            config['auth'] = not config['auth']
        elif choice == '4':
            config['ratelimit'] = not config['ratelimit']
        elif choice == '5':
            config['cache'] = not config['cache']
        elif choice == '6':
            config['gemini'] = not config['gemini']
        elif choice == '1':
            # Run simulation steps
            states = {k: 'idle' for k in ['trigger', 'auth', 'ratelimit', 'cache', 'llm', 'db', 'response']}
            logs = ["[System] Initializing simulation flow..."]
            
            # Step 1: Trigger
            states['trigger'] = 'active'
            exp = "Incoming HTTP Request received by the controller. Listening for code reviews."
            if mode == 'webhook':
                logs.append(f"{Colors.BLUE}[INFO] POST /api/v1/webhook/github request received.{Colors.RESET}")
                logs.append(f"{Colors.BLUE}[INFO] Event: pull_request, Action: opened{Colors.RESET}")
            else:
                logs.append(f"{Colors.BLUE}[INFO] POST /api/v1/review request received from client API.{Colors.RESET}")
            display_dashboard('trigger', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 2: Auth
            states['trigger'] = 'success'
            states['auth'] = 'active'
            exp = "Verifying client authentication tokens or webhook HMAC signature headers."
            display_dashboard('auth', states, mode, config, logs, exp)
            time.sleep(0.5)
            
            if mode == 'webhook':
                logs.append(f"{Colors.BLUE}[INFO] Verifying GitHub payload HmacSHA256 signature...{Colors.RESET}")
                if not config['auth']:
                    states['auth'] = 'error'
                    logs.append(f"{Colors.RED}[WARN] Invalid GitHub signature headers!{Colors.RESET}")
                    logs.append(f"{Colors.RED}[WARN] Terminated flow with status: 401 Unauthorized.{Colors.RESET}")
                    display_dashboard('auth', states, mode, config, logs, "Webhook signature verification failed! The request is blocked.")
                    input("\n[Simulation Terminated. Press Enter...]")
                    continue
                logs.append(f"{Colors.GREEN}[INFO] Webhook signature matching successful.{Colors.RESET}")
            else:
                logs.append(f"{Colors.BLUE}[INFO] Checking API Key hash in PostgreSQL database...{Colors.RESET}")
                if not config['auth']:
                    states['auth'] = 'error'
                    logs.append(f"{Colors.RED}[WARN] Unauthorized: Hashed API key not found in db!{Colors.RESET}")
                    logs.append(f"{Colors.RED}[WARN] Terminated flow with status: 401 Unauthorized.{Colors.RESET}")
                    display_dashboard('auth', states, mode, config, logs, "API Key authentication check failed! The request is blocked.")
                    input("\n[Simulation Terminated. Press Enter...]")
                    continue
                logs.append(f"{Colors.GREEN}[INFO] API Key verified. client: test-client{Colors.RESET}")
            
            states['auth'] = 'success'
            display_dashboard('auth', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 3: Rate Limiter
            states['ratelimit'] = 'active'
            exp = "Checking request limits in Redis. Directly increments and sets a rolling 1-minute TTL on the key."
            display_dashboard('ratelimit', states, mode, config, logs, exp)
            time.sleep(0.5)
            logs.append(f"{Colors.BLUE}[INFO] Querying Redis rate limiter database key...{Colors.RESET}")
            if not config['ratelimit']:
                states['ratelimit'] = 'error'
                logs.append(f"{Colors.RED}[WARN] Rate limit exceeded for client: test-client (11/10 requests/min){Colors.RESET}")
                logs.append(f"{Colors.RED}[WARN] Terminated flow with status: 429 Too Many Requests.{Colors.RESET}")
                display_dashboard('ratelimit', states, mode, config, logs, "Client exceeded limit quota bounds. Request rejected.")
                input("\n[Simulation Terminated. Press Enter...]")
                continue
            logs.append(f"{Colors.GREEN}[INFO] Rate limit checked. Remaining quota: 9/10 requests.{Colors.RESET}")
            states['ratelimit'] = 'success'
            display_dashboard('ratelimit', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 4: Cache Lookup
            states['cache'] = 'active'
            exp = "Checks if a code review for this exact commit SHA and PR URL has already been generated."
            display_dashboard('cache', states, mode, config, logs, exp)
            time.sleep(0.5)
            logs.append(f"{Colors.BLUE}[INFO] Querying Redis for cache key matching MD5(prUrl) + commitSha...{Colors.RESET}")
            
            if config['cache']:
                states['cache'] = 'success'
                logs.append(f"{Colors.GREEN}[INFO] Cache HIT! Review JSON payload found in Redis.{Colors.RESET}")
                states['response'] = 'active'
                display_dashboard('cache', states, mode, config, logs, "Cache check matches. Skipping LLM and PostgreSQL storage steps.")
                input("\n[Press Enter for next step...]")
                
                # Jump straight to output
                states['response'] = 'success'
                if mode == 'webhook':
                    logs.append(f"{Colors.BLUE}[INFO] Posting cached review comment to GitHub pull request #42...{Colors.RESET}")
                    time.sleep(0.5)
                    logs.append(f"{Colors.GREEN}[INFO] Asynchronous comment post complete.{Colors.RESET}")
                else:
                    logs.append(f"{Colors.GREEN}[INFO] Returning cached JSON response directly to REST caller.{Colors.RESET}")
                display_dashboard('response', states, mode, config, logs, "Flow finished successfully using cached results.")
                input("\n[Simulation Complete. Press Enter...]")
                continue
            
            logs.append(f"{Colors.BLUE}[INFO] Cache MISS. Proceeding to invoke AI Gemini model for review.{Colors.RESET}")
            states['cache'] = 'success'
            display_dashboard('cache', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 5: Gemini LLM
            states['llm'] = 'active'
            exp = "Sends the compiled file changes and code diff payload to the Google Gemini 1.5 Flash model."
            display_dashboard('llm', states, mode, config, logs, exp)
            time.sleep(0.5)
            logs.append(f"{Colors.BLUE}[INFO] Invoking Gemini API model 'gemini-1.5-flash'...{Colors.RESET}")
            
            if not config['gemini']:
                states['llm'] = 'error'
                logs.append(f"{Colors.RED}[WARN] Failed to parse model response: invalid JSON structure returned!{Colors.RESET}")
                logs.append(f"{Colors.RED}[WARN] Terminated flow with status: 500 Internal Server Error.{Colors.RESET}")
                display_dashboard('llm', states, mode, config, logs, "Gemini parser failure. Response structure was invalid.")
                input("\n[Simulation Terminated. Press Enter...]")
                continue
                
            logs.append(f"{Colors.GREEN}[INFO] Gemini analysis complete. Overall score: 88/100. Findings: 2.{Colors.RESET}")
            states['llm'] = 'success'
            display_dashboard('llm', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 6: DB Persistence
            states['db'] = 'active'
            exp = "Saving the generated review and finding details inside PostgreSQL tables."
            display_dashboard('db', states, mode, config, logs, exp)
            time.sleep(0.5)
            logs.append(f"{Colors.BLUE}[INFO] Saving review and mapped findings within transactional JPA session...{Colors.RESET}")
            logs.append(f"{Colors.GREEN}[INFO] Database insertion completed successfully.{Colors.RESET}")
            states['db'] = 'success'
            display_dashboard('db', states, mode, config, logs, exp)
            input("\n[Press Enter for next step...]")

            # Step 7: Response Output
            states['response'] = 'active'
            exp = "Returning the results. Posting comments to the PR on GitHub or returning JSON to API callers."
            display_dashboard('response', states, mode, config, logs, exp)
            time.sleep(0.5)
            if mode == 'webhook':
                logs.append(f"{Colors.BLUE}[INFO] Posting markdown review body to GitHub comments endpoint...{Colors.RESET}")
                time.sleep(0.5)
                logs.append(f"{Colors.GREEN}[INFO] Asynchronously posted comment to pull request #42.{Colors.RESET}")
            else:
                logs.append(f"{Colors.GREEN}[INFO] Returned review findings response payload (HTTP 200).{Colors.RESET}")
            states['response'] = 'success'
            display_dashboard('response', states, mode, config, logs, "Review flow execution complete.")
            input("\n[Simulation Complete. Press Enter...]")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting...")
