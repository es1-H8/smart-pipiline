# 🚀 Simple Smart Contract CI/CD Pipeline

A simple CI/CD pipeline that runs **ONLY on GitHub Actions** to test and deploy your smart contracts.

## 🎯 What This Does

- ✅ **Compiles** your smart contract on GitHub
- ✅ **Security analysis** with Slither and Solhint  
- ✅ **Automatic deployment** to Goerli testnet
- ✅ **No local testing** - everything runs on GitHub

## 📁 Project Structure

```
├── contracts/
│   └── SimpleContract.sol          # Simple smart contract
├── scripts/
│   └── deploy.js                   # Deployment script
├── .github/
│   └── workflows/
│       └── simple-ci-cd.yml        # GitHub Actions workflow
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Dependencies
└── SETUP_GUIDE.md                 # Setup instructions
```

## 🚀 Quick Start

### 1. Create GitHub Repository
- Go to GitHub → New repository
- Name it: `smart-contract-cicd`
- Make it Public

### 2. Clone and Push
```bash
git clone https://github.com/YOUR_USERNAME/smart-contract-cicd.git
cd smart-contract-cicd
git add .
git commit -m "Initial setup"
git push origin main
```

### 3. Add GitHub Secrets
Go to your repository → Settings → Secrets → Actions and add:
- `GOERLI_RPC_URL` - Your Infura Goerli endpoint
- `PRIVATE_KEY` - Your wallet private key
- `ETHERSCAN_API_KEY` - Your Etherscan API key

### 4. Watch It Work
- Go to Actions tab in your repository
- See the pipeline run automatically
- Contract deploys to Goerli testnet

## 🔍 How It Works

### Build Job
- Compiles `SimpleContract.sol` on GitHub
- Runs on every push

### Security Job  
- Slither vulnerability detection
- Solhint code quality checks

### Deploy Job
- Only runs on main branch pushes
- Deploys to Goerli testnet
- Sets initial value to 42

## 📊 Monitor Pipeline

1. Go to your repository → **Actions** tab
2. Watch workflow run automatically
3. See deployment logs and contract addresses

## 🚨 Troubleshooting

**Workflow not running?** Check if `.github/workflows/simple-ci-cd.yml` exists

**Build failed?** Check for syntax errors in `SimpleContract.sol`

**Deployment failed?** Verify all secrets are set correctly

## 🎉 Success

Your CI/CD pipeline is working when:
- ✅ All jobs complete successfully
- ✅ Smart contract compiles without errors  
- ✅ Contract deploys to Goerli
- ✅ You see deployment logs

## 🚀 Next Steps

Once working:
1. **Modify the contract** to add your functionality
2. **Push changes** to see pipeline run again
3. **Check deployed contracts** on Goerli Etherscan

---

**🎯 Goal**: Get CI/CD pipeline running on GitHub Actions only!

**⏱️ Setup Time**: 15-30 minutes

**🔧 Difficulty**: Beginner

**📖 For detailed setup**: See `SETUP_GUIDE.md` 