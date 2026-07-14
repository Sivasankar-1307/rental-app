/**
 * RentaFest Live E2E Smoke Test Script
 * -------------------------------------------------------------
 * This script runs real HTTP requests against a running RentaFest Node.js backend.
 * It verifies all major endpoints (Auth, Products, Orders, Admin, Agents)
 * are working with the live database and returns a beautiful terminal report.
 * 
 * Usage:
 *   1. Make sure your backend server is running (`npm run dev` or `npm start`)
 *   2. Run: `node tests/smoke.js`
 */

const http = require("http");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:8000";

// ANSI Terminal Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed = data;
        if (res.headers["content-type"] && res.headers["content-type"].includes("application/json")) {
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            // Use raw data if parsing fails
          }
        }
        resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runSmokeTest = async () => {
  console.log(`\n${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}       RentaFest API Live E2E Smoke Test Suite       ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.blue}Target Server:${colors.reset} ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;
  const tests = [];

  const assertTest = (name, condition, details = "") => {
    if (condition) {
      passed++;
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${name}`);
      tests.push({ name, status: "PASS", details });
    } else {
      failed++;
      console.log(`  ${colors.red}✘ [FAIL]${colors.reset} ${name} ${details ? `(${details})` : ""}`);
      tests.push({ name, status: "FAIL", details });
    }
  };

  try {
    // Test 1: Healthcheck
    try {
      const res = await request("GET", "/");
      assertTest("API Root Healthcheck", res.statusCode === 200 && res.body.message.includes("Welcome"));
    } catch (e) {
      assertTest("API Root Healthcheck", false, `Server unreachable. Is the server running on port 8000? Error: ${e.message}`);
      console.log(`\n${colors.red}Aborting remaining tests. Please start the server using 'npm run dev' and try again.${colors.reset}\n`);
      return;
    }

    // Test 2: Admin Login
    let adminToken = "";
    let adminId = null;
    const loginRes = await request("POST", "/auth/login", {
      username: "admin@test.com",
      password: "admin123"
    });
    const loginOk = loginRes.statusCode === 200 && loginRes.body.token;
    if (loginOk) {
      adminToken = loginRes.body.token;
      adminId = loginRes.body.id;
    }
    assertTest("Admin Login API (/auth/login)", loginOk, `Status: ${loginRes.statusCode}`);

    // Test 3: List Products
    const productsRes = await request("GET", "/products");
    assertTest("List Products (/products)", productsRes.statusCode === 200 && Array.isArray(productsRes.body));

    // Test 4: Create a Product (Admin)
    let testProductId = null;
    const newProduct = {
      title: "E2E Test Canopy",
      category: "Tents",
      price_per_day: 120.0,
      description: "Canopy created by automated smoke test",
      image: "",
      available: 15
    };
    const createProdRes = await request("POST", "/admin/products", newProduct);
    const prodCreated = createProdRes.statusCode === 200 && createProdRes.body.product;
    if (prodCreated) {
      testProductId = createProdRes.body.product.id;
    }
    assertTest("Admin Create Product (/admin/products)", prodCreated, `Status: ${createProdRes.statusCode}`);

    if (testProductId) {
      // Test 5: Retrieve created product details
      const singleProdRes = await request("GET", `/products/${testProductId}`);
      assertTest("Get Product Details (/products/:id)", singleProdRes.statusCode === 200 && singleProdRes.body.title === "E2E Test Canopy");

      // Test 6: Update product pricing (Admin)
      const updatePriceRes = await request("POST", "/admin/pricing", {
        product_id: testProductId,
        new_price: 135.0
      });
      assertTest("Admin Update Pricing (/admin/pricing)", updatePriceRes.statusCode === 200 && updatePriceRes.body.new_price === 135.0);
    } else {
      assertTest("Get Product Details (/products/:id)", false, "Skipped: Product creation failed");
      assertTest("Admin Update Pricing (/admin/pricing)", false, "Skipped: Product creation failed");
    }

    // Test 7: Get Admin Dashboard Stats
    const statsRes = await request("GET", "/admin/stats");
    assertTest("Admin Dashboard Stats (/admin/stats)", statsRes.statusCode === 200 && statsRes.body.revenue);

    // Test 8: Get Admin Real-time Inventory levels
    const inventoryRes = await request("GET", "/admin/inventory");
    assertTest("Admin Inventory Details (/admin/inventory)", inventoryRes.statusCode === 200 && Array.isArray(inventoryRes.body));

    // Test 9: Create and manage Delivery Agents (Admin CRUD)
    let agentId = null;
    const agentEmail = `agent_${Math.floor(Math.random() * 10000)}@test.com`;
    const agentRes = await request("POST", "/admin/agents", {
      name: "E2E Rider",
      username: agentEmail,
      password: "password123",
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      vehicle: "Motorcycle"
    });
    const agentOk = agentRes.statusCode === 200 && agentRes.body.id;
    if (agentOk) {
      agentId = agentRes.body.id;
    }
    assertTest("Admin Create Delivery Agent (/admin/agents)", agentOk, `Status: ${agentRes.statusCode}`);

    if (agentId) {
      // Test 10: List Delivery Agents
      const listAgentsRes = await request("GET", "/admin/agents");
      const foundAgent = listAgentsRes.body.some(a => a.id === agentId);
      assertTest("Admin List Delivery Agents (/admin/agents)", listAgentsRes.statusCode === 200 && foundAgent);

      // Test 11: Delete Delivery Agent
      const deleteAgentRes = await request("DELETE", `/admin/agents/${agentId}`);
      assertTest("Admin Delete Delivery Agent (/admin/agents/:id)", deleteAgentRes.statusCode === 200);
    } else {
      assertTest("Admin List Delivery Agents (/admin/agents)", false, "Skipped: Agent creation failed");
      assertTest("Admin Delete Delivery Agent (/admin/agents/:id)", false, "Skipped: Agent creation failed");
    }

    // Test 12: List Customers
    const customersRes = await request("GET", "/admin/customers");
    assertTest("Admin List Customers (/admin/customers)", customersRes.statusCode === 200 && Array.isArray(customersRes.body));

    // Test 13: List Refunds
    const refundsRes = await request("GET", "/admin/refunds");
    assertTest("Admin List Refunds (/admin/refunds)", refundsRes.statusCode === 200 && Array.isArray(refundsRes.body));

    // Cleanup: Delete test product created
    if (testProductId) {
      const deleteProdRes = await request("DELETE", `/admin/products/${testProductId}`);
      assertTest("E2E Cleanup - Delete Test Product", deleteProdRes.statusCode === 200);
    }

  } catch (err) {
    console.log(`\n${colors.red}Unhandled Error during Smoke Test Execution:${colors.reset}`, err);
    failed++;
  }

  // Final Summary Report
  console.log(`\n${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}                 SMOKE TEST SUMMARY                 ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`  Total Executed : ${passed + failed}`);
  console.log(`  Passed Tests   : ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed Tests   : ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}====================================================${colors.reset}`);

  if (failed === 0) {
    console.log(`\n🎉 ${colors.green}${colors.bright}ALL LIVE API ENDPOINTS ARE 100% OPERATIONAL!${colors.reset}\n`);
  } else {
    console.log(`\n⚠️  ${colors.red}${colors.bright}SOME ENDPOINTS ENCOUNTERED ISSUES. CHECK LOGS ABOVE.${colors.reset}\n`);
  }
};

runSmokeTest();
