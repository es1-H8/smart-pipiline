# 🚀 Quick Start Guide

## ⚡ Get Running in 5 Minutes

### 1. **Setup (Windows)**
```bash
# Double-click setup.bat or run:
setup.bat
```

### 2. **Setup (Linux/Mac)**
```bash
# Make executable and run:
chmod +x setup.sh
./setup.sh
```

### 3. **Manual Setup**
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npm test
```

## 🔑 **Configure Environment**

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your keys:**
   ```env
   GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_KEY
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PRIVATE_KEY=your_wallet_private_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

## 🚀 **Deploy to GitHub**

1. **Create new repository on GitHub**
2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial CI/CD pipeline setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Add GitHub Secrets:**
   - Go to: `Settings → Secrets → Actions`
   - Add: `GOERLI_RPC_URL`, `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`

## 🎯 **What Happens Next**

- ✅ **Pipeline automatically runs** when you push code
- ✅ **Tests execute** in parallel (7 test batches)
- ✅ **Security analysis** runs with Slither & Echidna
- ✅ **Contracts deploy** to testnets automatically
- ✅ **Results appear** in GitHub Actions tab

## 🔄 **Replace Sample Contracts**

1. **Put your contracts** in `contracts/` folder
2. **Write tests** in `test/` folder
3. **Update deployment script** in `scripts/deploy.js`
4. **Push to GitHub** - pipeline runs automatically!

## 📊 **Monitor Results**

- **GitHub Actions**: `Repository → Actions → CI/CD Pipeline`
- **Security Reports**: `Security → Code scanning alerts`
- **Test Results**: View in Actions logs

## 🆘 **Need Help?**

- **Check README.md** for detailed documentation
- **Review GitHub Actions logs** for error details
- **Run tests locally** first: `npm test`

---

**🎉 You're all set! Your CI/CD pipeline is ready to go!** 