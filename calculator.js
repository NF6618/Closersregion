/**
 * Lion Share Calculator
 * 
 * A standalone JavaScript calculator for computing Lion Share allocations
 * based on production metrics, agent status, and matching preferences.
 */

// Configuration data
const lionStatusConfig = {
    '13w': { buyIn: 0, matchingLimit: 0, inqueryBuyIn: 0 },
    '26w': { buyIn: 0, matchingLimit: 0, inqueryBuyIn: 0 },
    'vet': { buyIn: 50, matchingLimit: 0, inqueryBuyIn: 50 },
    'fta': { buyIn: 200, matchingLimit: 1000, inqueryBuyIn: 100 },
    'fsl': { buyIn: 400, matchingLimit: 1500, inqueryBuyIn: 200 },
    'sat': { buyIn: 600, matchingLimit: 2000, inqueryBuyIn: 300 }
};

const closersClubConfig = {
    'none': { matchingLimit: 0 },
    'newbies150k': { matchingLimit: 500 },
    'newbies200k': { matchingLimit: 750 },
    'newbies250k': { matchingLimit: 1000 },
    'closersClub': { matchingLimit: 1500 },
    'leaderClub': { matchingLimit: 2500 }
};

/**
 * Utility function to log debug messages
 * @param {string} message - Debug message to log
 */
function logDebug(message) {
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
        const timestamp = new Date().toLocaleTimeString();
        debugOutput.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    }
    console.log(message);
}

/**
 * Utility function to round a value to the nearest 50
 * @param {number} value - Value to round
 * @returns {number} - Value rounded to the nearest 50
 */
function roundToNearest50(value) {
    return Math.round(value / 50) * 50;
}

/**
 * Updates the matching options display based on user selection
 */
function updateMatchingOptions() {
    const nextGenSelected = document.getElementById('matchingNextGen').checked;
    const marketplaceSelected = document.getElementById('matchingMarketplace').checked;
    const splitSelected = document.getElementById('matchingSplit').checked;
    
    // Show or hide the appropriate sections
    const nextGenOptions = document.getElementById('nextGenOptions');
    const marketplaceOptions = document.getElementById('marketplaceOptions');
    const splitOptions = document.getElementById('splitOptions');
    
    if (nextGenOptions) nextGenOptions.style.display = nextGenSelected ? 'block' : 'none';
    if (marketplaceOptions) marketplaceOptions.style.display = marketplaceSelected ? 'block' : 'none';
    if (splitOptions) splitOptions.style.display = splitSelected ? 'block' : 'none';
    
    logDebug(`Matching options updated: NextGen=${nextGenSelected}, Marketplace=${marketplaceSelected}, Split=${splitSelected}`);
}

/**
 * Updates the buy-in requirements based on Lion Status
 */
function updateBuyInRequirements() {
    const lionStatus = document.getElementById('lionStatus').value;
    const inqueryBuyIn = lionStatusConfig[lionStatus].inqueryBuyIn || 0;
    const totalBuyIn = lionStatusConfig[lionStatus].buyIn || 0;
    
    // Update the required minimums displayed in the UI
    const requiredInqueryBuyIn = document.getElementById('requiredInqueryBuyIn');
    const requiredInqueryBuyInSplit = document.getElementById('requiredInqueryBuyInSplit');
    const requiredMarketplaceBuyIn = document.getElementById('requiredMarketplaceBuyIn');
    
    if (requiredInqueryBuyIn) requiredInqueryBuyIn.textContent = inqueryBuyIn;
    if (requiredInqueryBuyInSplit) requiredInqueryBuyInSplit.textContent = inqueryBuyIn;
    if (requiredMarketplaceBuyIn) requiredMarketplaceBuyIn.textContent = totalBuyIn;
    
    // Add a note about total buy-in requirement
    const inqueryNote = document.getElementById('inqueryBuyInMinimum');
    const splitNote = document.getElementById('inqueryBuyInMinimumSplit');
    
    let noteHTML = '';
    if (inqueryBuyIn > 0) {
        noteHTML = `Required minimum for InQuery: $${inqueryBuyIn}<br>`;
    }
    if (totalBuyIn > 0) {
        noteHTML += `Total buy-in required: $${totalBuyIn}<br>`;
        noteHTML += `<small class="text-danger">Missing buy-in disqualifies from Lion Share</small>`;
    }
    
    if (inqueryNote) inqueryNote.innerHTML = noteHTML;
    if (splitNote) splitNote.innerHTML = noteHTML;
    
    logDebug(`Buy-in requirements updated for ${lionStatus}: InQuery minimum = $${inqueryBuyIn}, Total required = $${totalBuyIn}`);
    
    // Debug the matching limit for the selected Lion Status
    const matchingLimit = lionStatusConfig[lionStatus].matchingLimit || 0;
    logDebug(`Selected Lion Status: ${lionStatus}, Matching Limit: $${matchingLimit}`);
}

/**
 * Main calculation function for Lion Share
 */
function calculateLionShare() {
    // Get input values
    const submittedAV = parseFloat(document.getElementById('submittedAV').value) || 0;
    const issuedAV = parseFloat(document.getElementById('issuedAV').value) || 0;
    const takenRate = parseFloat(document.getElementById('takenRate').value) || 0;
    
    // Check if taken rate meets minimum requirement (55%)
    const takenRateMeetsMinimum = takenRate >= 55;
    logDebug(`Taken Rate minimum check: ${takenRateMeetsMinimum} (Required: 55%, Actual: ${takenRate}%)`);
    
    if (!takenRateMeetsMinimum) {
        // Show the results section with warning
        showResults();
        document.getElementById('finalAllocation').innerHTML = 
            '<div class="alert alert-danger">Taken Rate below 55% - Not eligible for Lion Share</div>';
        clearResults();
        return; // Exit calculation early
    }
    
    // Get agent status
    const lionStatus = document.getElementById('lionStatus').value;
    const closersClub = document.getElementById('closersClub').value;
    
    // Get matching preferences
    const baseAndBonusInInquery = document.getElementById('baseAndBonusInInquery').checked;
    const matchingNextGen = document.getElementById('matchingNextGen').checked;
    const matchingMarketplace = document.getElementById('matchingMarketplace').checked;
    const matchingSplit = document.getElementById('matchingSplit').checked;
    
    // Get deposit values based on selected matching option
    let inqueryBuyIn = 0;
    let marketplaceBuyIn = 0;
    let nextGenMatchingDeposit = 0;
    let marketplaceMatchingDeposit = 0;
    
    if (matchingNextGen) {
        inqueryBuyIn = parseFloat(document.getElementById('inqueryBuyIn').value) || 0;
        const marketplaceBuyInNextGen = parseFloat(document.getElementById('marketplaceBuyInNextGen').value) || 0;
        marketplaceBuyIn = marketplaceBuyInNextGen; // Add this marketplace deposit to the total
        nextGenMatchingDeposit = parseFloat(document.getElementById('nextGenMatchingDeposit').value) || 0;
        logDebug(`NextGen option: InqueryBuyIn=$${inqueryBuyIn}, MarketplaceBuyIn=$${marketplaceBuyIn}, NextGenMatching=$${nextGenMatchingDeposit}`);
    } else if (matchingMarketplace) {
        marketplaceBuyIn = parseFloat(document.getElementById('marketplaceBuyIn').value) || 0;
        marketplaceMatchingDeposit = parseFloat(document.getElementById('marketplaceMatchingDeposit').value) || 0;
        logDebug(`Marketplace option: MarketplaceBuyIn=$${marketplaceBuyIn}, MarketplaceMatching=$${marketplaceMatchingDeposit}`);
    } else if (matchingSplit) {
        inqueryBuyIn = parseFloat(document.getElementById('inqueryBuyInSplit').value) || 0;
        marketplaceBuyIn = parseFloat(document.getElementById('marketplaceBuyInSplit').value) || 0;
        nextGenMatchingDeposit = parseFloat(document.getElementById('nextGenMatchingDepositSplit').value) || 0;
        marketplaceMatchingDeposit = parseFloat(document.getElementById('marketplaceMatchingDepositSplit').value) || 0;
        logDebug(`Split option: InqueryBuyIn=$${inqueryBuyIn}, MarketplaceBuyIn=$${marketplaceBuyIn}, ` + 
                 `NextGenMatching=$${nextGenMatchingDeposit}, MarketplaceMatching=$${marketplaceMatchingDeposit}`);
    }
    
    // Determine if NextGen buy-in minimum is met
    const requiredInqueryBuyIn = lionStatusConfig[lionStatus].inqueryBuyIn || 0;
    const totalBuyIn = inqueryBuyIn + marketplaceBuyIn;
    const requiredTotalBuyIn = lionStatusConfig[lionStatus].buyIn || 0;
    const nextGenBuyInMinimumMet = inqueryBuyIn >= requiredInqueryBuyIn;
    const totalBuyInRequirementMet = totalBuyIn >= requiredTotalBuyIn;
    
    logDebug(`Inquery buy-in minimum met: ${nextGenBuyInMinimumMet} (Required: $${requiredInqueryBuyIn}, Actual: $${inqueryBuyIn})`);
    logDebug(`Total buy-in requirement met: ${totalBuyInRequirementMet} (Required: $${requiredTotalBuyIn}, Actual: $${totalBuyIn})`);
    
    // Check buy-in requirements for Marketplace option
    if (matchingMarketplace) {
        const requiredMarketplaceBuyIn = requiredTotalBuyIn; // For marketplace, total buy-in applies
        const marketplaceBuyInMet = marketplaceBuyIn >= requiredMarketplaceBuyIn;
        
        if (requiredMarketplaceBuyIn > 0 && !marketplaceBuyInMet) {
            showResults();
            document.getElementById('finalAllocation').innerHTML = 
                '<div class="alert alert-danger">Marketplace Buy-In Requirement Not Met - Not eligible for Lion Share</div>';
            clearResults();
            logDebug(`Marketplace buy-in not met: Required $${requiredMarketplaceBuyIn}, Actual $${marketplaceBuyIn}`);
            return; // Exit calculation early
        }
    }
    
    // Check buy-in requirements for NextGen or Split options
    if ((matchingNextGen || matchingSplit) && requiredTotalBuyIn > 0 && !totalBuyInRequirementMet) {
        showResults();
        document.getElementById('finalAllocation').innerHTML = 
            '<div class="alert alert-danger">Total Buy-In Requirement Not Met - Not eligible for Lion Share</div>';
        clearResults();
        logDebug(`Total buy-in not met: Required $${requiredTotalBuyIn}, Actual $${totalBuyIn}`);
        return; // Exit calculation early
    }
    
    // Base Calculation
    let base = 0;
    if (issuedAV > 0 && submittedAV > 0) {
        base = 200;
    } else if (issuedAV > 0) {
        base = 75;
    } else if (submittedAV > 0) {
        base = 100;
    }
    logDebug(`Base calculation: $${base}`);
    
    // Bonus Calculation
    const takenRateDecimal = takenRate / 100;
    const bonus = ((submittedAV + issuedAV) / 100) * takenRateDecimal;
    logDebug(`Bonus calculation: $${bonus.toFixed(2)}`);
    
    // Total Base and Bonus
    const totalBaseBonus = base + bonus;
    logDebug(`Total Base & Bonus: $${totalBaseBonus.toFixed(2)}`);
    
    // For reference only - calculate AV-based matching
    let avBasedMatching = roundToNearest50((submittedAV + issuedAV) / 100);
    logDebug(`AV-based matching calculation (for reference only): $${avBasedMatching}`);
    
    // Apply matching limits - REVISED to use Lion Status/Closers Club as overrides
    const lionMatchingLimit = lionStatusConfig[lionStatus].matchingLimit;
    const clubMatchingLimit = closersClubConfig[closersClub].matchingLimit;
    
    // Debug the matching limits from Lion Status and Closers Club
    logDebug(`DEBUG - Lion Status: ${lionStatus}, Matching Limit: $${lionMatchingLimit}`);
    logDebug(`DEBUG - Closers Club: ${closersClub}, Matching Limit: $${clubMatchingLimit}`);
    
    let effectiveMatchingLimit = 0;
    
    // Determine effective matching limit - THE KEY CHANGE IS HERE
    if (closersClub !== 'none' && clubMatchingLimit > 0) {
        // Use Closers Club limit as the OVERRIDE value
        effectiveMatchingLimit = clubMatchingLimit;
        logDebug(`OVERRIDE: Using Closers Club matching amount: $${clubMatchingLimit} (overriding both Lion Status and AV-based calculation)`);
    } else if (lionMatchingLimit > 0) {
        // Use Lion Status limit as the OVERRIDE value
        effectiveMatchingLimit = lionMatchingLimit;
        logDebug(`OVERRIDE: Using Lion Status matching amount: $${lionMatchingLimit} (overriding AV-based calculation)`);
    } else {
        // No override, use AV-based matching
        effectiveMatchingLimit = avBasedMatching;
        logDebug(`No Lion Status/Closers Club override, using AV-based matching: $${avBasedMatching}`);
    }
    
    // Set matching available directly to the override amount
    const matchingAvailable = effectiveMatchingLimit;
    logDebug(`Final matching available (after overrides): $${matchingAvailable}`);
    
    // Calculate final allocations
    let nextGenMatching = 0;
    let marketplaceMatching = 0;
    
    if (matchingNextGen) {
        // Check both requirements for NextGen matching eligibility
        if (nextGenBuyInMinimumMet && totalBuyInRequirementMet) {
            nextGenMatching = Math.min(nextGenMatchingDeposit, matchingAvailable);
            logDebug(`NextGen matching allocated: $${nextGenMatching}`);
        } else {
            if (!nextGenBuyInMinimumMet) {
                logDebug(`No NextGen matching allocated - InQuery buy-in minimum not met`);
            }
            if (!totalBuyInRequirementMet) {
                logDebug(`No NextGen matching allocated - total buy-in requirement not met`);
            }
        }
    } else if (matchingMarketplace) {
        marketplaceMatching = Math.min(marketplaceMatchingDeposit, matchingAvailable);
        logDebug(`Marketplace matching allocated: $${marketplaceMatching}`);
    } else if (matchingSplit) {
        // Split matching 50/50 if buy-in minimum is met
        const halfMatching = matchingAvailable / 2;
        logDebug(`Split matching - half available: $${halfMatching}`);
        
        // For NextGen portion, check both InQuery minimum and total buy-in
        if (nextGenBuyInMinimumMet && totalBuyInRequirementMet) {
            nextGenMatching = Math.min(nextGenMatchingDeposit, halfMatching);
            logDebug(`NextGen portion of split matching: $${nextGenMatching}`);
        } else {
            if (!nextGenBuyInMinimumMet) {
                logDebug(`No NextGen portion allocated - InQuery buy-in minimum not met`);
            }
            if (!totalBuyInRequirementMet) {
                logDebug(`No NextGen portion allocated - total buy-in requirement not met`);
            }
        }
        
        marketplaceMatching = Math.min(marketplaceMatchingDeposit, halfMatching);
        logDebug(`Marketplace portion of split matching: $${marketplaceMatching}`);
    }
    
    // Update results in the UI
    showResults();
    updateResultDisplay(base, bonus, totalBaseBonus, matchingAvailable, effectiveMatchingLimit, 
                      inqueryBuyIn, marketplaceBuyIn, nextGenMatching, marketplaceMatching, 
                      baseAndBonusInInquery, nextGenBuyInMinimumMet, totalBuyInRequirementMet,
                      matchingNextGen, matchingSplit);
    
    logDebug("Calculation complete");
}

/**
 * Shows the results section
 */
function showResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

/**
 * Clears all result values
 */
function clearResults() {
    document.getElementById('baseResult').textContent = '$0.00';
    document.getElementById('bonusResult').textContent = '$0.00';
    document.getElementById('totalBaseBonus').textContent = '$0.00';
    document.getElementById('matchingAvailable').textContent = '$0.00';
    document.getElementById('nextGenMatchingResult').textContent = '$0.00';
    document.getElementById('marketplaceMatchingResult').textContent = '$0.00';
}

/**
 * Updates the result display with calculated values
 * @param {number} base - Base amount
 * @param {number} bonus - Bonus amount
 * @param {number} totalBaseBonus - Total of base and bonus
 * @param {number} matchingAvailable - Total matching available
 * @param {number} effectiveMatchingLimit - Effective matching limit
 * @param {number} inqueryBuyIn - InQuery buy-in amount
 * @param {number} marketplaceBuyIn - Marketplace buy-in amount
 * @param {number} nextGenMatching - NextGen matching amount
 * @param {number} marketplaceMatching - Marketplace matching amount
 * @param {boolean} baseAndBonusInInquery - Whether base and bonus are in InQuery
 * @param {boolean} nextGenBuyInMinimumMet - Whether NextGen buy-in minimum is met
 * @param {boolean} totalBuyInRequirementMet - Whether total buy-in requirement is met
 * @param {boolean} matchingNextGen - Whether NextGen matching is selected
 * @param {boolean} matchingSplit - Whether split matching is selected
 */
function updateResultDisplay(base, bonus, totalBaseBonus, matchingAvailable, effectiveMatchingLimit, 
                          inqueryBuyIn, marketplaceBuyIn, nextGenMatching, marketplaceMatching, 
                          baseAndBonusInInquery, nextGenBuyInMinimumMet, totalBuyInRequirementMet,
                          matchingNextGen, matchingSplit) {
    // Update base calculation results
    document.getElementById('baseResult').textContent = '$' + base.toFixed(2);
    document.getElementById('bonusResult').textContent = '$' + bonus.toFixed(2);
    document.getElementById('totalBaseBonus').textContent = '$' + totalBaseBonus.toFixed(2);
    document.getElementById('matchingAvailable').textContent = '$' + matchingAvailable.toFixed(2);
    
    // Update platform display
    document.getElementById('baseAndBonusPlatform').textContent = 
        baseAndBonusInInquery ? 'InQuery' : 'Marketplace';
    
    // Update matching limit display
    document.getElementById('matchingLimit').textContent = 
        effectiveMatchingLimit > 0 ? 'Matching Amount: $' + effectiveMatchingLimit : 'No Matching Available';
    
    // Update deposit displays
    document.getElementById('totalInqueryDeposit').textContent = '$' + inqueryBuyIn.toFixed(2);
    document.getElementById('totalMarketplaceDeposit').textContent = '$' + marketplaceBuyIn.toFixed(2);
    
    // Update matching results
    document.getElementById('nextGenMatchingResult').textContent = '$' + nextGenMatching.toFixed(2);
    document.getElementById('marketplaceMatchingResult').textContent = '$' + marketplaceMatching.toFixed(2);
    
    // Display buy-in status
    const nextGenBuyInStatus = document.getElementById('nextGenBuyInStatus');
    if (matchingNextGen || matchingSplit) {
        let statusHTML = '';
        
        // Check InQuery minimum
        if (nextGenBuyInMinimumMet) {
            statusHTML += '<div class="text-success">InQuery Buy-In Minimum Met</div>';
        } else {
            statusHTML += '<div class="text-danger">InQuery Buy-In Minimum Not Met - No Matching Eligible</div>';
        }
        
        // Check total buy-in requirement
        if (totalBuyInRequirementMet) {
            statusHTML += '<div class="text-success">Total Buy-In Requirement Met</div>';
        } else {
            statusHTML += '<div class="text-danger">Total Buy-In Requirement Not Met - No Matching Eligible</div>';
        }
        
        // Set the status
        nextGenBuyInStatus.innerHTML = statusHTML;
    } else {
        nextGenBuyInStatus.innerHTML = '';
    }
    
    // Generate the final allocation summary
    let finalAllocationHTML = '';
    
    if (totalBaseBonus > 0) {
        finalAllocationHTML += '<p><strong>Base & Bonus:</strong> $' + totalBaseBonus.toFixed(2) + 
            ' in ' + (baseAndBonusInInquery ? 'InQuery' : 'Marketplace') + '</p>';
        
        finalAllocationHTML += '<p><strong>Matching:</strong></p>';
        
        if (nextGenMatching > 0) {
            finalAllocationHTML += '<p class="ms-3">$' + nextGenMatching.toFixed(2) + ' in NextGen</p>';
        }
        
        if (marketplaceMatching > 0) {
            finalAllocationHTML += '<p class="ms-3">$' + marketplaceMatching.toFixed(2) + ' in Marketplace</p>';
        }
        
        if (nextGenMatching === 0 && marketplaceMatching === 0) {
            finalAllocationHTML += '<p class="ms-3 text-danger">No matching allocated. Please check your inputs and requirements.</p>';
        }
    }
    
    document.getElementById('finalAllocation').innerHTML = finalAllocationHTML;
}

/**
 * Initialize the calculator
 */
function initializeCalculator() {
    // Set up event listeners
    document.getElementById('matchingNextGen').addEventListener('change', updateMatchingOptions);
    document.getElementById('matchingMarketplace').addEventListener('change', updateMatchingOptions);
    document.getElementById('matchingSplit').addEventListener('change', updateMatchingOptions);
    
    document.getElementById('lionStatus').addEventListener('change', updateBuyInRequirements);
    document.getElementById('calculateButton').addEventListener('click', calculateLionShare);
    
    // Initialize the form
    updateMatchingOptions();
    updateBuyInRequirements();
    
    logDebug("Calculator initialized");
}

// Initialize the calculator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);
