// dummyData was deleted; providing empty fallback arrays to satisfy Vite build
const users = [];
const dropdowns = { statuses: [], sources: [] };
const companies = [];
const initialFmsData = [];
const initialQuotations = [];
const initialEnquiryTracker = [];
const initialEnquiryToOrder = [];
const products = [];
const initialFollowUpHistory = [];

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// LocalStorage Helper
const DB_KEY = 'botivate_db';

const initDB = () => {
    if (!localStorage.getItem(DB_KEY)) {
        const initialState = {
            fmsData: [],
            quotations: [],
            enquiryTracker: [],
            enquiryToOrder: [],
            followUpHistory: [],
            companies: [],
            scMaster: [
                { id: 1, timestamp: "2023-10-01 10:00", sourceName: "Indiamart", personName: "Indiamart Person" },
                { id: 2, timestamp: "2023-10-02 11:30", sourceName: "Justdial", personName: "Justdial Person" },
                { id: 3, timestamp: "2023-10-03 14:15", sourceName: "Social Media", personName: "Social Media Person" },
                { id: 4, timestamp: "2023-10-04 15:00", sourceName: "Website", personName: "Website Person" },
                { id: 5, timestamp: "2023-10-05 16:20", sourceName: "Referral", personName: "Referral Person" }
            ],
            users: users
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialState));
    } else {
        // Add users array to existing database if it doesn't exist
        const db = JSON.parse(localStorage.getItem(DB_KEY));
        let needsUpdate = false;

        if (!db.users) {
            db.users = users;
            needsUpdate = true;
        }
        if (!db.companies) {
            db.companies = [];
            needsUpdate = true;
        }
        if (!db.fmsData) {
            db.fmsData = [];
            needsUpdate = true;
        }
        if (!db.quotations) {
            db.quotations = [];
            needsUpdate = true;
        }
        if (!db.enquiryTracker) {
            db.enquiryTracker = [];
            needsUpdate = true;
        }
        if (!db.enquiryToOrder) {
            db.enquiryToOrder = [];
            needsUpdate = true;
        }
        if (!db.followUpHistory) {
            db.followUpHistory = [];
            needsUpdate = true;
        }
        if (!db.scMaster || (db.scMaster.length > 0 && (db.scMaster[0].personName === "Rahul Sharma" || db.scMaster[0].personName === "Indiamart Person"))) {
            db.scMaster = [
                { id: 1, timestamp: "2023-10-01 10:00", sourceName: "Indiamart", personName: "Priyanshu" },
                { id: 2, timestamp: "2023-10-02 11:30", sourceName: "Justdial", personName: "Prabhat" },
                { id: 3, timestamp: "2023-10-03 14:15", sourceName: "Social Media", personName: "Iqra" },
                { id: 4, timestamp: "2023-10-04 15:00", sourceName: "Website", personName: "Pooja" },
                { id: 5, timestamp: "2023-10-05 16:20", sourceName: "Referral", personName: "Karan" }
            ];
            needsUpdate = true;
        }

        if (needsUpdate) {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        }

        // MIGRATION: Fix existing leads that incorrectly have both flags true.
        // A lead with hasPendingFollowUp:true should NOT yet be in Enquiry Tracker Pending.
        // hasPendingCallTracker is only set true AFTER the Follow-Up process completes.
        const dbFix = JSON.parse(localStorage.getItem(DB_KEY));
        let fixApplied = false;
        if (dbFix.fmsData && dbFix.fmsData.length > 0) {
            dbFix.fmsData = dbFix.fmsData.map(lead => {
                if (lead.hasPendingFollowUp === true && lead.hasPendingCallTracker === true) {
                    fixApplied = true;
                    return { ...lead, hasPendingCallTracker: false };
                }
                return lead;
            });
        }
        if (fixApplied) {
            localStorage.setItem(DB_KEY, JSON.stringify(dbFix));
        }
    }
};

const getDB = () => {
    initDB();
    return JSON.parse(localStorage.getItem(DB_KEY));
};

const saveDB = (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const getNextHandlePerson = (db) => {
    const assignedLeads = (db.fmsData || []).filter(l => l.handlePerson === 'Nikita' || l.handlePerson === 'Priya');
    if (assignedLeads.length === 0) {
        return 'Nikita';
    }
    const lastAssigned = assignedLeads[assignedLeads.length - 1].handlePerson;
    return lastAssigned === 'Nikita' ? 'Priya' : 'Nikita';
};

const isCrrOrNbdCrr = (st) => {
    if (!st) return false;
    const clean = String(st).toLowerCase().trim();
    return clean === "crr" || clean === "nbd_crr" || clean === "nbd-crr" || clean === "nbd crr";
};


export const mockApi = {
    clearAllData: async () => {
        await simulateDelay();
        // Remove existing DB and initialize an empty one
        localStorage.removeItem(DB_KEY);
        const emptyDB = {
            fmsData: [],
            quotations: [],
            enquiryTracker: [],
            enquiryToOrder: [],
            followUpHistory: [],
            users: users, // keep users for login
            companies: [],
            scMaster: [
                { id: 1, timestamp: "2023-10-01 10:00", sourceName: "Indiamart", personName: "Priyanshu" },
                { id: 2, timestamp: "2023-10-02 11:30", sourceName: "Justdial", personName: "Prabhat" },
                { id: 3, timestamp: "2023-10-03 14:15", sourceName: "Social Media", personName: "Iqra" },
                { id: 4, timestamp: "2023-10-04 15:00", sourceName: "Website", personName: "Pooja" },
                { id: 5, timestamp: "2023-10-05 16:20", sourceName: "Referral", personName: "Karan" }
            ]
        };
        saveDB(emptyDB);
        // Force a page reload to reset all states across the app
        window.location.href = '/';
        return { success: true };
    },

    // Auth and Static Data
    login: async (username, password) => {
        await simulateDelay();
        const db = getDB();
        const user = db.users.find(u => u.username === username && u.password === password);
        if (user) {
            return {
                success: true,
                user: {
                    username: user.username,
                    userType: user.userType,
                    loginTime: new Date().toISOString()
                }
            };
        }
        return { success: false, message: "Invalid credentials" };
    },

    fetchUsers: async () => {
        await simulateDelay();
        const db = getDB();
        return db.users; // Return full user data including password for admin
    },

    addUser: async (userData) => {
        await simulateDelay();
        const db = getDB();
        if (db.users.some(u => u.username === userData.username)) {
            return { success: false, message: "Username already exists" };
        }
        db.users.push({
            username: userData.username,
            password: userData.password,
            userType: userData.userType || "user"
        });
        saveDB(db);
        return { success: true, message: "User added successfully" };
    },

    updateUser: async (oldUsername, userData) => {
        await simulateDelay();
        const db = getDB();
        const userIndex = db.users.findIndex(u => u.username === oldUsername);
        if (userIndex !== -1) {
            if (oldUsername !== userData.username && db.users.some(u => u.username === userData.username)) {
                return { success: false, message: "New username already exists" };
            }
            db.users[userIndex] = {
                username: userData.username,
                password: userData.password || db.users[userIndex].password,
                userType: userData.userType
            };
            saveDB(db);
            return { success: true, message: "User updated successfully" };
        }
        return { success: false, message: "User not found" };
    },

    deleteUser: async (username) => {
        await simulateDelay();
        const db = getDB();
        const initialLength = db.users.length;
        db.users = db.users.filter(u => u.username !== username);
        if (db.users.length !== initialLength) {
            saveDB(db);
            return { success: true, message: "User deleted successfully" };
        }
        return { success: false, message: "User not found" };
    },

    updateUserRole: async (username, newRole) => {
        await simulateDelay();
        const db = getDB();
        const userIndex = db.users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            db.users[userIndex].userType = newRole;
            saveDB(db);
            return { success: true, message: "User role updated successfully" };
        }
        return { success: false, message: "User not found" };
    },

    fetchDropdowns: async () => {
        await simulateDelay();
        return dropdowns;
    },

    fetchCompanies: async () => {
        await simulateDelay();
        const db = getDB();
        return db.companies || [];
    },

    addCompany: async (companyData) => {
        await simulateDelay();
        const db = getDB();
        if (!db.companies) db.companies = [];
        if (db.companies.some(c => c.name === companyData.name)) {
            return { success: false, message: "Company already exists" };
        }
        db.companies.push(companyData);
        saveDB(db);
        return { success: true };
    },

    updateCompany: async (oldName, companyData) => {
        await simulateDelay();
        const db = getDB();
        if (!db.companies) db.companies = [];
        const index = db.companies.findIndex(c => c.name === oldName);
        if (index !== -1) {
            db.companies[index] = { ...db.companies[index], ...companyData };
            saveDB(db);
            return { success: true };
        }
        return { success: false, message: "Company not found" };
    },

    deleteCompany: async (companyName) => {
        await simulateDelay();
        const db = getDB();
        if (!db.companies) db.companies = [];
        db.companies = db.companies.filter(c => c.name !== companyName);
        saveDB(db);
        return { success: true };
    },

    fetchScMaster: async () => {
        await simulateDelay();
        const db = getDB();
        return db.scMaster || [];
    },

    addScMaster: async (scData) => {
        await simulateDelay();
        const db = getDB();
        if (!db.scMaster) db.scMaster = [];
        const newId = db.scMaster.length > 0 ? Math.max(...db.scMaster.map(d => d.id)) + 1 : 1;
        db.scMaster.push({ id: newId, ...scData });
        saveDB(db);
        return { success: true };
    },

    updateScMaster: async (id, scData) => {
        await simulateDelay();
        const db = getDB();
        if (!db.scMaster) db.scMaster = [];
        const index = db.scMaster.findIndex(s => s.id === id);
        if (index !== -1) {
            db.scMaster[index] = { ...db.scMaster[index], ...scData };
            saveDB(db);
            return { success: true };
        }
        return { success: false };
    },

    deleteScMaster: async (id) => {
        await simulateDelay();
        const db = getDB();
        if (!db.scMaster) db.scMaster = [];
        db.scMaster = db.scMaster.filter(s => s.id !== id);
        saveDB(db);
        return { success: true };
    },

    fetchProducts: async () => {
        await simulateDelay();
        return products;
    },

    fetchUserData: async (username, userType) => {
        await simulateDelay();
        const db = getDB();
        if (userType === 'admin') {
            return [...db.fmsData].reverse();
        }
        return db.fmsData.filter(d => d.assignedUser === username).reverse();
    },

    // 1. Leads
    generateLeadNumber: async () => {
        await simulateDelay();
        const db = getDB();
        const maxLeadNo = db.fmsData.reduce((max, lead) => {
            if (lead.leadNumber && lead.leadNumber.startsWith('LD-')) {
                const num = parseInt(lead.leadNumber.replace('LD-', ''), 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        return `LD-${(maxLeadNo + 1).toString().padStart(3, '0')}`;
    },

    submitLead: async (leadData) => {
        await simulateDelay();
        const db = getDB();
        const newLeadNumber = await mockApi.generateLeadNumber();
        const newLead = {
            date: leadData.date || new Date().toLocaleDateString('en-GB'),
            timestamp: leadData.timestamp || (new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
            leadNumber: newLeadNumber,
            company: leadData.companyName,
            source: leadData.source,
            assignedUser: leadData.salespersonName || "admin", // Simple default
            receiver: leadData.receiverName,
            status: "Pending",
            followUpDate: "",
            hasPendingFollowUp: true,
            hasPendingCallTracker: false, // Only becomes true after Follow-Up process completes
            phoneNumber: leadData.phoneNumber || "",
            email: leadData.email || "",
            location: leadData.location || "",
            state: leadData.state || "",
            address: leadData.address || "",
            gst: leadData.gst || "",
            scName: leadData.scName || "",
            customerSay: leadData.customerSay || "",
            enquiryStatus: leadData.enquiryStatus || "",
            nextAction: leadData.nextAction || "",
            lastFollowUpDate: leadData.lastFollowUpDate || "",
            noOfFollowUps: leadData.noOfFollowUps || "",
            lastFollowUpStatus: leadData.lastFollowUpStatus || "",
            personName1: leadData.contactPersons?.[0]?.name || "",
            designation1: leadData.contactPersons?.[0]?.designation || "",
            phoneNumber1: leadData.contactPersons?.[0]?.number || "",
            personName2: leadData.contactPersons?.[1]?.name || "",
            designation2: leadData.contactPersons?.[1]?.designation || "",
            phoneNumber2: leadData.contactPersons?.[1]?.number || "",
            personName3: leadData.contactPersons?.[2]?.name || "",
            designation3: leadData.contactPersons?.[2]?.designation || "",
            phoneNumber3: leadData.contactPersons?.[2]?.number || "",
            natureOfBusiness: leadData.nob || "",
            salesType: leadData.salesType || "",
            handlePerson: isCrrOrNbdCrr(leadData.salesType) ? getNextHandlePerson(db) : "",
            additionalNotes: leadData.notes || "",
            groupName: leadData.groupName || ""
        };
        db.fmsData.push(newLead);

        if (leadData.source === "Other" && leadData.scName) {
            if (!db.scMaster) db.scMaster = [];
            const exists = db.scMaster.some(sc => sc.sourceName === "Other" && sc.personName === leadData.scName);
            if (!exists) {
                const newId = db.scMaster.length > 0 ? Math.max(...db.scMaster.map(d => d.id)) + 1 : 1;
                db.scMaster.push({
                    id: newId,
                    timestamp: new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    sourceName: "Other",
                    personName: leadData.scName
                });
            }
        }

        saveDB(db);
        return { success: true, leadNumber: newLeadNumber };
    },

    bulkSubmitLeads: async (leadsArray) => {
        await simulateDelay();
        const db = getDB();
        const today = new Date().toLocaleDateString('en-GB');
        const results = [];

        for (const leadData of leadsArray) {
            // Find the current max lead number each time so numbers increment correctly
            const maxLeadNo = db.fmsData.reduce((max, lead) => {
                if (lead.leadNumber && lead.leadNumber.startsWith('LD-')) {
                    const num = parseInt(lead.leadNumber.replace('LD-', ''), 10);
                    return num > max ? num : max;
                }
                return max;
            }, 0);
            const newLeadNumber = `LD-${(maxLeadNo + 1).toString().padStart(3, '0')}`;

            const newLead = {
                date: today,
                timestamp: today + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                leadNumber: newLeadNumber,
                company: leadData.companyName || "",
                source: leadData.source || "",
                assignedUser: leadData.salespersonName || leadData.personName || "admin",
                receiver: leadData.receiverName || "",
                status: "Pending",
                followUpDate: "",
                hasPendingFollowUp: true,
                hasPendingCallTracker: false, // Only becomes true after Follow-Up process completes
                phoneNumber: leadData.phoneNumber || "",
                email: leadData.email || "",
                location: leadData.location || "",
                state: leadData.state || "",
                address: leadData.address || "",
                gst: leadData.gstNumber || "",
                scName: leadData.scName || "",
                personName1: leadData.person1Name || "",
                designation1: leadData.person1Designation || "",
                phoneNumber1: leadData.person1Phone || "",
                personName2: leadData.person2Name || "",
                designation2: leadData.person2Designation || "",
                phoneNumber2: leadData.person2Phone || "",
                personName3: leadData.person3Name || "",
                designation3: leadData.person3Designation || "",
                phoneNumber3: leadData.person3Phone || "",
                natureOfBusiness: leadData.nob || "",
                salesType: leadData.salesType || "",
                handlePerson: leadData.handlePerson || (isCrrOrNbdCrr(leadData.salesType) ? getNextHandlePerson(db) : ""),
                additionalNotes: leadData.additionalNotes || "",
                groupName: leadData.groupName || ""
            };

            db.fmsData.push(newLead);
            results.push({ leadNumber: newLeadNumber, company: newLead.company });
        }

        saveDB(db);
        return { success: true, count: results.length, results };
    },

    // 2. Follow Up (Call Tracker in UI)
    fetchFollowUps: async (currentUser, isAdminFunc) => {
        await simulateDelay();
        const db = getDB();
        const username = currentUser?.username;

        const pendingFollowUps = db.fmsData.filter(row => {
            const assignedUser = row.assignedUser;
            const shouldInclude = isAdminFunc() || assignedUser === username;
            return shouldInclude && row.hasPendingFollowUp;
        }).map(row => ({
            timestamp: row.timestamp || row.date,
            id: row.leadNumber,
            leadId: row.leadNumber,
            enquiryType: "Lead",
            receiver: row.receiver || "",
            companyName: row.company,
            personName: row.scName || row.assignedUser || "John Doe",
            scName: row.scName || "",
            phoneNumber: row.phoneNumber || "9876543210",
            leadSource: row.source,
            location: row.location || "Mumbai",
            customerSay: row.customerSay || "Interested",
            enquiryStatus: row.enquiryStatus || "New",
            createdAt: row.date,
            nextCallDate: row.followUpDate,
            priority: "High",
            assignedTo: row.assignedUser,
            itemQty: "",
            email: row.email || "",
            nextAction: row.nextAction || "Call Again",
            lastFollowUpDate: row.lastFollowUpDate || "Not available",
            noOfFollowUps: row.noOfFollowUps || "0",
            lastFollowUpStatus: row.lastFollowUpStatus || "Pending",
            state: row.state || "",
            address: row.address || "",
            personName1: row.personName1 || "",
            designation1: row.designation1 || "",
            phoneNumber1: row.phoneNumber1 || "",
            personName2: row.personName2 || "",
            designation2: row.designation2 || "",
            phoneNumber2: row.phoneNumber2 || "",
            personName3: row.personName3 || "",
            designation3: row.designation3 || "",
            phoneNumber3: row.phoneNumber3 || "",
            natureOfBusiness: row.natureOfBusiness || "",
            gst: row.gst || "",
            additionalNotes: row.additionalNotes || "",
            groupName: row.groupName || "",
            handlePerson: row.handlePerson || ""
        })).reverse();

        // Combine enquiryTracker and followUpHistory to ensure all history shows
        const historySource = [...(db.enquiryTracker || []), ...(db.followUpHistory || [])];
        const historyFollowUps = historySource.filter(row => {
            const assignedUser = row.assignedTo || "admin";
            return isAdminFunc() || assignedUser === username;
        }).map(row => {
            const lNo = row.leadNo || row.enquiryNo || row.leadId;
            const lead = db.fmsData.find(l => l.leadNumber === lNo);
            const dirEnq = db.enquiryToOrder.find(e => e.leadNumber === lNo);
            const historyObj = {
                timestamp: row.timestamp || row.date,
                leadNo: lNo,
                companyName: row.companyName || row.company || (lead ? lead.company : (dirEnq ? dirEnq.company : "Unknown")),
                personName: row.personName || (lead ? (lead.scName || lead.assignedUser) : (dirEnq ? dirEnq.salespersonName : "John Doe")),
                phoneNumber: row.phoneNumber || (lead ? lead.phoneNumber : (dirEnq ? dirEnq.phoneNumber : "9876543210")),
                customerSay: row.customerFeedback || row.customerSay || "Completed call",
                status: "Completed",
                enquiryReceivedStatus: row.enquiryStatus || "New",
                enquiryReceivedDate: row.date,
                callingCount: row.callingCount || "1",
                enquiryCallingCount: row.enquiryCallingCount || "0",
                noOfFollowUps: row.noOfFollowUps || "0",
                lastFollowUpStatus: row.lastFollowUpStatus || "Pending",
                state: row.state || (lead ? lead.state : ""),
                projectName: row.projectName || "",
                salesType: row.salesType || "",
                nextAction: row.nextAction || "Wait",
                nextCallDate: row.nextCallDate,
                assignedTo: row.assignedTo,
                itemQty: ""
            };

            if (row.items && Array.isArray(row.items)) {
                row.items.forEach((item, idx) => {
                    if (idx < 5) {
                        historyObj[`itemName${idx + 1}`] = item.name;
                        historyObj[`itemQty${idx + 1}`] = item.quantity;
                    }
                });
            }

            return historyObj;
        }).reverse();

        return {
            pending: pendingFollowUps,
            history: historyFollowUps
        };
    },

    submitFollowUp: async (data) => {
        await simulateDelay();
        const db = getDB();

        // Find the lead
        const leadIdToFind = data.leadNo || data.leadId;
        const leadIndex = db.fmsData.findIndex(l => l.leadNumber === leadIdToFind);
        if (leadIndex !== -1) {
            const lead = db.fmsData[leadIndex];

            // Add to follow-up history
            if (!db.followUpHistory) db.followUpHistory = [];
            db.followUpHistory.push({
                ...data,
                date: new Date().toLocaleDateString('en-GB'),
                timestamp: new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                companyName: lead.company,
                assignedTo: lead.assignedUser,
                callingCount: (parseInt(lead.noOfFollowUps) || 0) + 1,
                lastFollowUpStatus: data.enquiryStatus
            });

            // Update lead data for Pending / UI
            const currentCount = parseInt(db.fmsData[leadIndex].noOfFollowUps) || 0;
            db.fmsData[leadIndex].noOfFollowUps = (currentCount + 1).toString();
            db.fmsData[leadIndex].lastFollowUpDate = new Date().toLocaleDateString('en-GB');
            db.fmsData[leadIndex].lastFollowUpStatus = data.enquiryStatus || "expected";
            db.fmsData[leadIndex].customerSay = data.customerFeedback || data.customerSay || "";


            // Update pending status based on enquiryStatus
            if (data.enquiryStatus === "yes") {
                db.fmsData[leadIndex].hasPendingFollowUp = false;
                db.fmsData[leadIndex].hasPendingCallTracker = true; // Moves it to Enquiry Tracker pending

                // Update lead properties with any user changes from the form
                if (data.leadSource !== undefined) db.fmsData[leadIndex].source = data.leadSource;
                if (data.scName !== undefined) db.fmsData[leadIndex].scName = data.scName;
                if (data.companyName !== undefined) db.fmsData[leadIndex].company = data.companyName;
                if (data.phoneNumber !== undefined) db.fmsData[leadIndex].phoneNumber = data.phoneNumber;
                if (data.salesPersonName !== undefined) {
                    db.fmsData[leadIndex].personName1 = data.salesPersonName;
                }
                if (data.location !== undefined) db.fmsData[leadIndex].location = data.location;
                if (data.emailAddress !== undefined) db.fmsData[leadIndex].email = data.emailAddress;
                if (data.shippingAddress !== undefined) db.fmsData[leadIndex].shippingAddress = data.shippingAddress;
                if (data.enquiryReceiverName !== undefined) db.fmsData[leadIndex].receiver = data.enquiryReceiverName;
                if (data.enquiryAssignToProject !== undefined) db.fmsData[leadIndex].assignedUser = data.enquiryAssignToProject;
                if (data.gstNumber !== undefined) db.fmsData[leadIndex].gst = data.gstNumber;
                if (data.enquiryState !== undefined) db.fmsData[leadIndex].state = data.enquiryState;
                if (data.projectName !== undefined) db.fmsData[leadIndex].natureOfBusiness = data.projectName;
                if (data.salesType !== undefined) {
                    db.fmsData[leadIndex].salesType = data.salesType;
                    if (isCrrOrNbdCrr(data.salesType) && !db.fmsData[leadIndex].handlePerson) {
                        db.fmsData[leadIndex].handlePerson = getNextHandlePerson(db);
                    }
                }
                if (data.enquiryApproach !== undefined) db.fmsData[leadIndex].enquiryApproach = data.enquiryApproach;
                if (data.enquiryDate !== undefined) db.fmsData[leadIndex].enquiryDate = data.enquiryDate;
            } else if (data.enquiryStatus === "expected") {
                db.fmsData[leadIndex].hasPendingFollowUp = true; // Stay in Follow Up pending
                db.fmsData[leadIndex].followUpDate = data.nextCallDate;
                db.fmsData[leadIndex].nextAction = data.nextAction || "";
                db.fmsData[leadIndex].hasPendingCallTracker = false;
            } else {
                // Not interested or other
                db.fmsData[leadIndex].hasPendingFollowUp = false;
                db.fmsData[leadIndex].hasPendingCallTracker = false;
            }

            saveDB(db);
            return { success: true };
        }
        return { success: false, error: "Lead not found" };
    },

    // 3. Call Trackers (Enquiry Tracker in UI)
    fetchCallTrackers: async (currentUser, isAdminFunc) => {
        await simulateDelay();
        const db = getDB();
        const username = currentUser?.username;

        const pendingCallTrackers = db.fmsData.filter(row => {
            const assignedUser = row.assignedUser;
            const shouldInclude = isAdminFunc() || assignedUser === username;
            return shouldInclude && row.hasPendingCallTracker;
        }).map((row, index) => ({
            id: index + 1,
            timestamp: row.timestamp || row.date,
            leadId: row.leadNumber,
            receiverName: row.receiver || "Receiver",
            leadSource: row.source,
            scName: row.scName || "",
            salespersonName: row.scName || row.assignedUser,
            phoneNumber: row.phoneNumber || "9876543210",
            companyName: row.company,
            createdAt: row.date,
            status: "Expected",
            priority: "Medium",
            stage: "Pending",
            dueDate: "",
            assignedTo: row.assignedUser,
            currentStage: row.currentStage || "Stage 1",
            callingDate: row.followUpDate || "today",
            itemQty: "",
            totalQty: "",
            location: row.location || "",
            email: row.email || "",
            state: row.state || "",
            address: row.address || "",
            gst: row.gst || "",
            customerSay: row.customerSay || "",
            enquiryStatus: row.enquiryStatus || "",
            nextAction: row.nextAction || "Call Again",
            lastFollowUpDate: row.lastFollowUpDate || "Not available",
            noOfFollowUps: row.noOfFollowUps || "0",
            lastFollowUpStatus: row.lastFollowUpStatus || "Pending",
            personName1: row.personName1 || "",
            designation1: row.designation1 || "",
            phoneNumber1: row.phoneNumber1 || "",
            personName2: row.personName2 || "",
            designation2: row.designation2 || "",
            phoneNumber2: row.phoneNumber2 || "",
            personName3: row.personName3 || "",
            designation3: row.designation3 || "",
            phoneNumber3: row.phoneNumber3 || "",
            natureOfBusiness: row.natureOfBusiness || "",
            additionalNotes: row.additionalNotes || "",
            groupName: row.groupName || "",
            shippingAddress: row.shippingAddress || row.address || "",
            // Unified mappings
            enquiryReceiverName: row.receiver || "",
            enquiryAssignToProject: row.assignedUser || "",
            gstNumber: row.gst || "",
            enquiryDate: row.enquiryDate || row.date || "",
            enquiryState: row.state || "",
            projectName: row.natureOfBusiness || "",
            salesType: row.salesType || "",
            enquiryApproach: row.enquiryApproach || "",
            customerFeedback: row.customerSay || "",
            handlePerson: row.handlePerson || ""
        })).reverse();

        // History Enquiry Trackers
        const historyCallTrackers = db.enquiryTracker.filter(row => {
            const assignedUser = row.assignedTo || "admin";
            const shouldInclude = isAdminFunc() || assignedUser === username;
            return shouldInclude;
        }).map((row, index) => {
            const leadId = row.leadNo || row.enquiryNo;
            const fmsLead = db.fmsData.find(l => l.leadNumber === leadId) || {};
            const dirEnq = db.enquiryToOrder.find(e => e.leadNumber === leadId) || {};
            const shippingAddress = row.shippingAddress || dirEnq.shippingAddress || fmsLead.shippingAddress || fmsLead.address || "";

            // Format itemQty from array if present
            let formattedItemQty = "";
            let totalQtyVal = 0;
            if (row.items && Array.isArray(row.items)) {
                formattedItemQty = row.items
                    .filter(item => item.name && item.quantity && item.quantity !== "0")
                    .map(item => `${item.name} : ${item.quantity}`)
                    .join(", ");
                totalQtyVal = row.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
            }

            const historyObj = {
                id: index + 1,
                timestamp: row.timestamp || row.date,
                leadId: leadId,
                leadSource: row.leadSource || fmsLead.source || dirEnq.leadSource || "Direct",
                companyName: row.companyName || row.company || fmsLead.company || dirEnq.company || "Unknown",
                phoneNumber: row.phoneNumber || fmsLead.phoneNumber || dirEnq.phoneNumber || "9876543210",
                salespersonName: row.salespersonName || fmsLead.scName || fmsLead.assignedUser || dirEnq.salespersonName || row.assignedTo || "admin",
                currentStage: row.currentStage || "Negotiation",
                callingDate: row.callingDate || row.nextCallDate || row.date || "",
                itemQty: formattedItemQty,
                totalQty: totalQtyVal.toString(),
                shippingAddress: shippingAddress,
                enquiryReceiverName: row.enquiryReceiverName || row.receiverName || fmsLead.receiver || dirEnq.receiverName || "",
                enquiryAssignToProject: row.enquiryAssignToProject || row.assignedTo || fmsLead.assignedUser || "",
                gstNumber: row.gstNumber || fmsLead.gst || dirEnq.gstNumber || "",
                enquiryDate: row.enquiryDate || row.date || "",
                enquiryState: row.enquiryState || fmsLead.state || dirEnq.enquiryState || "",
                projectName: row.projectName || fmsLead.natureOfBusiness || "",
                salesType: row.salesType || fmsLead.salesType || "",
                enquiryApproach: row.enquiryApproach || fmsLead.enquiryApproach || "",
                enquiryStatus: row.enquiryStatus || "Active",
                customerFeedback: row.customerFeedback || row.customerSay || "Good",
                sendQuotationNo: row.sendQuotationNo || "",
                quotationSharedBy: row.quotationSharedBy || "",
                quotationNumber: row.quotationNumber || row.quotationNo || "Q-123",
                valueWithoutTax: row.valueWithoutTax || "1000",
                valueWithTax: row.valueWithTax || "1180",
                quotationUpload: row.quotationFileUrl || row.quotationUpload || "",
                remarks: row.remarks || row.quotationRemarks || "",
                quotationRemarks: row.remarks || row.quotationRemarks || "",
                validatorName: row.validatorName || "",
                sendStatus: row.sendStatus || "",
                validationRemark: row.validationRemark || "",
                faqVideo: row.faqVideo || "no",
                productVideo: row.productVideo || "no",
                offerVideo: row.offerVideo || "no",
                productCatalog: row.productCatalog || "no",
                productImage: row.productImage || "no",
                nextCallTime: row.nextCallTime || "",
                orderStatus: row.orderStatus || "Pending",
                reasonStatus: row.reasonStatus || "",
                reasonRemark: row.reasonRemark || "",
                holdReason: row.holdReason || "",
                holdingDate: row.holdingDate || "",
                holdRemark: row.holdRemark || "",
                transportMode: row.transportMode || "",
                conveyedForRegistration: row.conveyedForRegistration || "",
                orderNo: row.orderNumber || "",
                destination: row.destination || "",
                poNumber: row.poNumber || ""
            };

            // Map individual items 1-5
            if (row.items && Array.isArray(row.items)) {
                row.items.forEach((item, idx) => {
                    if (idx < 5) {
                        historyObj[`itemName${idx + 1}`] = item.name;
                        historyObj[`itemQty${idx + 1}`] = item.quantity;
                    }
                });
            }

            return historyObj;
        }).reverse();

        // Direct Enquiry Pending
        const directEnquiryPendingTrackers = db.enquiryToOrder.filter(row => {
            return row.status === "Pending";
        }).map((row, index) => ({
            id: index + 1,
            timestamp: row.timestamp || row.date,
            leadId: row.leadNumber,
            receiverName: row.receiverName || "",
            leadSource: row.leadSource || "Direct",
            scName: row.scName || "",
            salespersonName: row.scName || row.assignedUser || "",
            phoneNumber: row.phoneNumber || "",
            companyName: row.company,
            createdAt: row.date,
            status: "Expected",
            priority: "High",
            stage: "Pending",
            assignedTo: currentUser?.username || "admin",
            currentStage: "Order",
            callingDate: "today",
            itemQty: "",
            totalQty: "",
            shippingAddress: row.shippingAddress || row.location || "",
            // Map the unified fields
            enquiryReceiverName: row.receiverName || "",
            enquiryAssignToProject: row.assignedUser || "",
            gstNumber: row.gstNumber || "",
            enquiryDate: row.date || "",
            enquiryState: row.enquiryState || "",
            projectName: row.projectName || "",
            salesType: row.salesType || "",
            enquiryApproach: row.enquiryApproach || "",
            customerFeedback: "",
        })).reverse();

        return {
            pending: pendingCallTrackers,
            history: historyCallTrackers,
            directEnquiry: directEnquiryPendingTrackers
        };
    },

    submitCallTracker: async (data) => {
        await simulateDelay();
        const db = getDB();

        const rowData = data.rowData || [];
        const leadId = data.leadId || rowData[1];
        const enquiryStatus = data.enquiryStatus || rowData[2] || "Active";
        const customerFeedback = data.customerFeedback || rowData[3] || "Good";
        const currentStage = data.currentStage || rowData[4] || "Negotiation";
        const quotationNo = data.quotationNumber || data.validationQuotationNumber || data.orderStatusQuotationNumber || rowData[7] || "";

        let companyName = data.companyName || "Unknown Company";
        let assignedTo = data.assignedTo || "admin";

        // When Enquiry is processed, check if Order is Received
        const isOrderReceived = currentStage === "order-status" && (data.orderStatus === "yes" || String(rowData[22]).toLowerCase() === "yes");

        const leadIndex = db.fmsData.findIndex(l => l.leadNumber === leadId);
        let fmsLead = {};
        if (leadIndex !== -1) {
            companyName = db.fmsData[leadIndex].company || companyName;
            assignedTo = db.fmsData[leadIndex].assignedUser || assignedTo;
            fmsLead = db.fmsData[leadIndex];

            if (isOrderReceived) {
                db.fmsData[leadIndex].hasPendingCallTracker = false;
                if (!db.fmsData[leadIndex].handlePerson) {
                    db.fmsData[leadIndex].handlePerson = getNextHandlePerson(db);
                }
            } else {
                db.fmsData[leadIndex].hasPendingCallTracker = true;
                db.fmsData[leadIndex].currentStage = currentStage;
                db.fmsData[leadIndex].customerSay = customerFeedback;
                db.fmsData[leadIndex].enquiryStatus = enquiryStatus;
                if (currentStage === "order-expected") {
                    db.fmsData[leadIndex].followUpDate = data.nextCallDate || rowData[20] || "today"; // column U is nextCallDate
                }
            }
        }

        const dirEnqIndex = db.enquiryToOrder.findIndex(e => e.leadNumber === leadId);
        let dirEnq = {};
        if (dirEnqIndex !== -1) {
            dirEnq = db.enquiryToOrder[dirEnqIndex];
            if (isOrderReceived) {
                db.enquiryToOrder[dirEnqIndex].status = "Completed";
            } else {
                db.enquiryToOrder[dirEnqIndex].status = "Pending";
                db.enquiryToOrder[dirEnqIndex].currentStage = currentStage;
            }
        } else {
            dirEnq = db.enquiryToOrder.find(e => e.leadNumber === leadId) || {};
        }

        if (isOrderReceived) {
            if (!db.companies) db.companies = [];
            if (companyName && !db.companies.find(c => c.name === companyName)) {
                db.companies.push({
                    name: companyName,
                    salesPerson: assignedTo,
                    handlePerson: fmsLead.handlePerson || (leadIndex !== -1 ? db.fmsData[leadIndex].handlePerson : "") || "",
                    phoneNumber: dirEnq.phoneNumber || fmsLead.phoneNumber || "9876543210",
                    email: dirEnq.emailAddress || fmsLead.email || "",
                    location: dirEnq.location || fmsLead.location || "",
                    consignorState: dirEnq.enquiryState || fmsLead.state || "",
                    consignorAddress: dirEnq.location || fmsLead.address || "",
                    consignorGSTIN: dirEnq.gstNumber || fmsLead.gst || ""
                });
            }
        }

        const newEnquiryNo = `En-${Date.now().toString().slice(-4)}`;
        const shippingAddress = dirEnq.shippingAddress || fmsLead.shippingAddress || fmsLead.address || "";
        db.enquiryTracker.push({
            date: new Date().toLocaleDateString('en-GB'),
            timestamp: new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            enquiryNo: newEnquiryNo,
            leadNo: leadId,
            companyName: companyName,
            assignedTo: assignedTo,
            nextCallDate: data.nextCallDate || rowData[20] || "today",
            orderReceived: isOrderReceived ? "Yes" : "No",
            enquiryStatus: enquiryStatus,
            customerFeedback: customerFeedback,
            currentStage: currentStage,
            quotationNo: quotationNo,
            shippingAddress: shippingAddress,
            rowData: rowData,
            ...data
        });

        saveDB(db);
        return { success: true };
    },

    // 4. Quotations
    fetchExistingQuotations: async (isAdminFunc) => {
        await simulateDelay();
        const db = getDB();
        return db.quotations.map(q => q.quotationNo);
    },

    getQuotationData: async (quotationNo) => {
        await simulateDelay();
        const db = getDB();
        const quote = db.quotations.find(q => q.quotationNo === quotationNo);
        if (quote) {
            return { success: true, quotationData: quote };
        }
        return { success: false, error: "Quotation not found" };
    },

    saveQuotation: async (data, action = "save") => {
        await simulateDelay();
        const db = getDB();
        const quotationNumber = data.quotationNumber || `NBD-2526-${Date.now().toString().slice(-4)}`;

        db.quotations.push({
            ...data,
            quotationNo: quotationNumber,
            date: new Date().toLocaleDateString('en-GB')
        });

        saveDB(db);
        return { success: true, quotationNumber };
    },

    getNextQuotationNumber: async (prefix = "NBD") => {
        await simulateDelay();
        const db = getDB();
        return `${prefix}-2526-${(db.quotations.length + 1).toString().padStart(3, '0')}`;
    },

    fetchQuotationsForEnquiry: async (enquiryNo) => {
        await simulateDelay();
        const db = getDB();
        return db.quotations.map(q => q.quotationNo); // Return all for now
    },

    // Dashboards and metrics
    fetchDashboardMetrics: async (currentUser, isAdminFunc) => {
        await simulateDelay();
        const db = getDB();
        const username = currentUser?.username;

        const filterUser = (item) => {
            if (isAdminFunc()) return true;
            return item.assignedUser === username || item.assignedTo === username;
        };

        const myFms = db.fmsData.filter(filterUser);
        const myQuotations = db.quotations.filter(filterUser);
        const myEnquiries = db.enquiryTracker.filter(filterUser);
        const myEnquiryToOrder = db.enquiryToOrder.filter(filterUser);

        return {
            totalLeads: myFms.length.toString(),
            pendingFollowups: myFms.filter(d => d.hasPendingFollowUp).length.toString(),
            quotationsSent: myQuotations.length.toString(),
            ordersReceived: myEnquiries.filter(d => d.orderReceived === "Yes").length.toString(),
            totalEnquiry: myEnquiryToOrder.length.toString(),
            pendingEnquiry: myEnquiryToOrder.filter(d => d.status === "Pending").length.toString()
        };
    },

    fetchDashboardAppCharts: async (currentUser, isAdminFunc) => {
        await simulateDelay();
        const db = getDB();
        const username = currentUser?.username;
        const isAdmin = isAdminFunc();

        const checkPerm = (row) => isAdmin || (row.assignedUser === username || row.assignedTo === username);

        const monthlyData = {};

        db.fmsData.forEach(row => {
            if (checkPerm(row)) {
                const parts = row.date.split('/');
                if (parts.length === 3) {
                    const month = new Date(parts[2], parts[1] - 1, parts[0]).toLocaleString('en-US', { month: 'short' });
                    if (!monthlyData[month]) monthlyData[month] = { leads: 0, enquiries: 0, orders: 0 };
                    monthlyData[month].leads++;
                }
            }
        });

        db.enquiryTracker.forEach(row => {
            if (checkPerm(row) && row.orderReceived === "Yes") {
                const parts = row.date.split('/');
                if (parts.length === 3) {
                    const month = new Date(parts[2], parts[1] - 1, parts[0]).toLocaleString('en-US', { month: 'short' });
                    if (!monthlyData[month]) monthlyData[month] = { leads: 0, enquiries: 0, orders: 0 };
                    monthlyData[month].orders++;
                }
            }
        });

        const leadData = Object.keys(monthlyData).map(month => ({
            month,
            leads: monthlyData[month].leads,
            enquiries: monthlyData[month].enquiries,
            orders: monthlyData[month].orders
        }));

        const totalLeads = db.fmsData.filter(checkPerm).length;
        const totalEnquiries = db.enquiryTracker.filter(checkPerm).length;
        const totalQuotations = db.quotations.filter(checkPerm).length;
        const totalOrders = db.enquiryTracker.filter(r => checkPerm(r) && r.orderReceived === "Yes").length;

        const conversionData = [
            { name: "Leads", value: totalLeads, color: "#4f46e5" },
            { name: "Enquiries", value: totalEnquiries, color: "#8b5cf6" },
            { name: "Quotations", value: totalQuotations, color: "#d946ef" },
            { name: "Orders", value: totalOrders, color: "#ec4899" }
        ];

        const sourceCounter = {};
        db.fmsData.forEach(row => {
            if (checkPerm(row) && row.source) {
                sourceCounter[row.source] = (sourceCounter[row.source] || 0) + 1;
            }
        });

        const sourceData = Object.keys(sourceCounter).map((name, index) => ({
            name,
            value: sourceCounter[name],
            color: ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6"][index % 5]
        }));

        return { leadData, conversionData, sourceData };
    },

    // Others / Utilities
    getCompanyPrefix: async (companyName) => {
        await simulateDelay();
        return "NBD";
    },

    fetchLastEnquiryNumber: async () => {
        await simulateDelay();
        const db = getDB();
        return `En-${(db.enquiryTracker.length + 1).toString().padStart(3, '0')}`;
    },

    getLatestOrderNumber: async () => {
        return "DO-05";
    },

    uploadFile: async (file) => {
        await simulateDelay();
        return "https://dummy-file-url.com/file";
    },

    submitEnquiry: async (data, action = "insert") => {
        await simulateDelay();
        const db = getDB();

        const enquiryNo = data.trackerData?.enquiryNo || `DIR-${Date.now().toString().slice(-4)}`;
        const companyName = data.trackerData?.companyName;

        if (action === "insert") {
            const source = data.trackerData?.leadSource;
            const scName = data.trackerData?.scName;

            if (source === "Other" && scName) {
                if (!db.scMaster) db.scMaster = [];
                const exists = db.scMaster.some(sc => sc.sourceName === "Other" && sc.personName === scName);
                if (!exists) {
                    const newId = db.scMaster.length > 0 ? Math.max(...db.scMaster.map(d => d.id)) + 1 : 1;
                    db.scMaster.push({
                        id: newId,
                        timestamp: new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        sourceName: "Other",
                        personName: scName
                    });
                }
            }

            db.enquiryToOrder.push({
                date: new Date().toLocaleDateString('en-GB'),
                leadNumber: enquiryNo,
                company: companyName,
                assignedUser: data.trackerData?.salesPersonName || "admin",
                receiverName: data.trackerData?.enquiryReceiverName || "",
                leadSource: data.trackerData?.leadSource || "Direct",
                scName: data.trackerData?.scName || "",
                status: "Pending",
                phoneNumber: data.trackerData?.phoneNumber || "",
                emailAddress: data.trackerData?.emailAddress || "",
                location: data.trackerData?.location || "",
                enquiryState: data.enquiryData?.enquiryState || "",
                gstNumber: data.trackerData?.gstNumber || "",
                shippingAddress: data.trackerData?.shippingAddress || ""
            });
        }

        saveDB(db);
        return { success: true };
    },

    fetchEnquiryDropdowns: async () => {
        await simulateDelay();
        return {
            sources: dropdowns.sources,
            scNames: ["SC 1", "SC 2", "SC 3"],
            states: dropdowns.states,
            salesTypes: ["NBD", "CRR", "NBD_CRR"],
            productCategories: products.map(p => p.name),
            nobOptions: dropdowns.nobs,
            approachOptions: ["Incoming", "Outgoing"],
            receivers: dropdowns.receivers,
            assignToProjects: ["Person-1", "Person-2", "Person-3", "Person-4"]
        };
    },

    fetchQuotationDropdowns: async () => {
        await simulateDelay();
        const response = {
            states: {},
            companies: {},
            references: {},
            preparedBy: users.map(u => u.username)
        };

        const db = getDB();
        const allCompanies = db.companies || [];

        allCompanies.forEach(comp => {
            response.companies[comp.name] = {
                address: comp.location,
                state: comp.consignorState,
                contactName: comp.salesPerson,
                contactNo: comp.phoneNumber,
                gstin: "27AA...",
                stateCode: "27"
            };
        });

        dropdowns.states.forEach(state => {
            response.states[state] = {
                bankDetails: "Account No: 1234567890\nBank Name: HDFC\nIFSC: HDFC0001234",
                consignerAddress: `Address in ${state}`,
                stateCode: "10",
                gstin: "10AAA...",
                pan: "ABC...",
                msmeNumber: "MSME..."
            };
        });

        dropdowns.receivers.forEach(ref => {
            response.references[ref] = {
                mobile: "9999999999"
            };
        });

        return response;
    },

    fetchValidationDropdowns: async () => {
        await simulateDelay();
        return {
            sendStatusOptions: ["mail", "whatsapp", "both"],
            validatorNameOptions: users.map(u => u.username)
        };
    },

    fetchOrderStatusDropdowns: async () => {
        await simulateDelay();
        return {
            acceptanceViaOptions: ["email", "phone", "in-person", "other"],
            paymentModeOptions: ["cash", "check", "bank-transfer", "credit-card"],
            reasonStatusOptions: ["price", "competitor", "timeline", "specifications", "other"],
            holdReasonOptions: ["budget", "approval", "project-delay", "reconsideration", "other"],
            paymentTermsOptions: ["30", "45", "60", "90"],
            conveyedOptions: ["Yes", "No"],
            transportModeOptions: ["Road", "Air", "Sea", "Rail"],
            creditDaysOptions: ["30", "45", "60", "90"],
            creditLimitOptions: ["10000", "25000", "50000", "100000"]
        };
    },

    fetchOrderExpectedDropdowns: async () => {
        await simulateDelay();
        return {
            followupStatusOptions: ["Pending", "In Progress", "Completed", "Cancelled"]
        };
    },

    generateSendQuotationNo: async (enquiryNo) => {
        await simulateDelay();
        return "1";
    },

    fetchLeadNumbers: async () => {
        await simulateDelay();
        const db = getDB();
        const leadNumbers = {};

        db.fmsData.forEach(row => {
            if (row.hasPendingFollowUp) {
                leadNumbers[row.leadNumber] = {
                    sheet: "FMS",
                    companyName: row.company,
                    address: "Mock Address FMS",
                    state: "Maharashtra",
                    contactName: row.receiver,
                    contactNo: "9876543210",
                    gstin: "27ABC...",
                    rowData: []
                };
            }
        });

        db.enquiryToOrder.forEach(row => {
            if (row.status === "Pending") {
                leadNumbers[row.enquiryNo] = {
                    sheet: "ENQUIRY",
                    companyName: "Mock Company Enquiry",
                    address: "Mock Address Enquiry",
                    state: "Delhi",
                    contactName: row.assignedUser,
                    contactNo: "8765432109",
                    gstin: "07XYZ...",
                    rowData: []
                };
            }
        });

        return leadNumbers;
    },

    // Report Metrics
    fetchReportSCNames: async () => {
        await simulateDelay();
        return ["SC 1", "SC 2", "SC 3", "admin", "User A", "User B"];
    },

    fetchCallingReportMetrics: async (filters) => {
        await simulateDelay();
        const db = getDB();

        let totalLeads = 0;
        let calls = 0;
        let enquiries = 0;
        let quotations = 0;
        let orders = 0;
        let quotationValue = 0;
        let orderQuotationValue = 0;

        const isDateInRange = (dateStr, start, end) => {
            if (!dateStr) return false;
            // Basic date mock parsing assuming "DD/MM/YYYY" or similar from mock db
            const target = new Date().getTime(); // Simplification for mock
            const s = start ? new Date(start).setHours(0, 0, 0, 0) : null;
            const e = end ? new Date(end).setHours(23, 59, 59, 999) : null;

            if (s && target < s) return false;
            if (e && target > e) return false;
            return true;
        };

        db.fmsData.forEach(row => {
            if (filters.scName !== "all" && row.assignedUser !== filters.scName) return;
            if (!isDateInRange(row.date, filters.startDate, filters.endDate)) return;
            totalLeads++;
            calls++;
        });

        db.enquiryTracker.forEach(row => {
            if (filters.scName !== "all" && row.assignedTo !== filters.scName) return;
            if (!isDateInRange(row.date, filters.startDate, filters.endDate)) return;
            enquiries++;
            if (row.quotationNo) quotations++;
            if (row.orderReceived === "Yes") {
                orders++;
                orderQuotationValue += 10000; // Mock value
            }
            quotationValue += 10000; // Mock value
        });

        return {
            totalLeads, calls, enquiries, quotations, orders, quotationValue, orderQuotationValue
        };
    },

    fetchFosReportMetrics: async (filters) => {
        await simulateDelay();
        const db = getDB();

        let enquiryCount = 0;
        let totalValue = 0;
        let convertedValue = 0;
        let orderConvert = 0;

        let pipelineEnquiryCount = 0;
        let pipelineTotalValue = 0;

        db.enquiryToOrder.forEach(row => {
            if (filters.receiverName !== "all" && row.assignedUser !== filters.receiverName) return;

            enquiryCount++;
            totalValue += 50000; // Mock value

            if (row.status !== "Pending") {
                orderConvert++;
                convertedValue += 50000;
            } else {
                pipelineEnquiryCount++;
                pipelineTotalValue += 50000;
            }
        });

        const FOS_RECEIVERS = [
            "PRANAV VINAYAKRAO BHOGAWAR", "RANJAN KUMAR PRUSTY", "SAMIRAN RAJBONGSHI",
            "ROSHAN DEWANGAN", "TUSHAR ATRAM", "SUBHRAJIT BEHERA", "MANOSH ROY CHOUDHURY", "AMAN JHA"
        ];

        let conversionMetrics = FOS_RECEIVERS.map(name => ({
            name: name,
            totalEnquiries: 10,
            orderConversions: 2,
            conversionPercentage: 20,
            avgTicketSize: 50000
        }));

        if (filters.receiverName !== "all") {
            conversionMetrics = conversionMetrics.filter(met => met.name === filters.receiverName);
        }

        return {
            enquiryCount, totalValue, convertedValue, orderConvert,
            pipelineMetrics: { enquiryCount: pipelineEnquiryCount, totalValue: pipelineTotalValue },
            conversionMetrics
        };
    },

    fetchScPipelineReportMetrics: async (filters) => {
        await simulateDelay();
        return {
            leadsCount: 15,
            leadsValue: 150000,
            enquiryCount: 5,
            enquiryValue: 50000
        };
    },

    fetchFilteredVisitCount: async (filters) => {
        await simulateDelay();
        return 42; // Mock visit count
    }
};
