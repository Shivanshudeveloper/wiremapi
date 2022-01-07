const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51IdwfeH8KzFo5uc9YHKzp2HOPkZJvH0ij0qhWeg0wQ17G73o5fVJYjMkWOfAmWUgjVZe0DesJvrQKbmAPSacXsVP00qMXnEqFr"
);
const { v4: uuidv4 } = require("uuid");
// Getting Module
const Products_Model = require("../models/Products");
const MainStore_Model = require("../models/MainStore");

const FeaturedProduct_Model = require("../models/FeaturedProduct");
const Notification_Model = require("../models/Notification");
const Userfileupload_Model = require("../models/Userfileupload");


const FileUpload_Model = require("../models/FileUpload");


function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

// TEST
// @GET TEST
// GET
router.get("/test", (req, res) => {
  res.send("Working");
});

// Database CRUD Operations
// @POST Request to GET the People
// GET
router.get("/getallproductapi", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  Products_Model.find({})
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

// Database CRUD Operations
// @POST Request to GET the People
// GET
router.get("/getallproductsmainstorefilters/:filter", (req, res) => {
  const { filter } = req.params;
  res.setHeader("Content-Type", "application/json");
  MainStore_Model.find({ gender: filter })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

// Database CRUD Operations
// @POST Request to GET the Product Details
// GET
router.patch("/hidefeatured/:id", async (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  const product = await FeaturedProduct_Model.find({ _id: id });
  await FeaturedProduct_Model.findByIdAndUpdate(
    id,
    { ...product, hidden: true },
    { new: true, useFindAndModify: false }
  )
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

router.patch("/unhidefeatured/:id", async (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  const product = await FeaturedProduct_Model.find({ _id: id });
  await FeaturedProduct_Model.findByIdAndUpdate(
    id,
    { ...product, hidden: false },
    { new: true, useFindAndModify: false }
  )
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

router.get("/getproductitemdetails/:id", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  MainStore_Model.find({ _id: id })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



// Database CRUD Operations
// @POST Request to GET the People
// POST
router.post("/addfileuploadtoserver", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const {
    useremail,
    userfullname,
    userphone,
    name,
    cut,
    content,
    uploaded_to,
    status,
    reception,
    delivery_date,
    publicURL
  } = req.body;

  FileUpload_Model.countDocuments({ publicURL }).then((count) => {
    if (count === 0) {
      const newProductMainStore = new FileUpload_Model({
        useremail,
        userfullname,
        userphone,
        name,
        cut,
        content,
        uploaded_to,
        status,
        reception,
        delivery_date,
        publicURL
      });
      newProductMainStore
        .save()
        .then((data) => {
          res.status(200).json(data._id);
        })
        .catch(
          (err) => {
            console.log(err)
          }
        );
    }
  });
});



router.get("/getuserfileuploadedtoserver/:useremail", (req, res) => {
  const { useremail } = req.params;
  res.setHeader("Content-Type", "application/json");
  FileUpload_Model.find({ useremail: useremail }).sort({ date: -1 })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



router.get("/getuserallfileuploadedtoserver", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  FileUpload_Model.find({}).sort({ date: -1 })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});


router.get("/changestatusfileupload/:id/:status/:email/:filename", (req, res) => {
  const { id, status, email, filename } = req.params;
  res.setHeader("Content-Type", "application/json");
  FileUpload_Model.findOneAndUpdate(
    { _id: id },
    { status },
    { useFindAndModify: false }
  )
    .then(() => {
      const newNotification = new Notification_Model({
        useremail: email,
        message: `File ${filename} status changed to ${status}`
      });
      newNotification
        .save()
        .then((data) => {
          res.status(200).json("Updated Product");
        })
        .catch(
          (err) => {
            console.log(err)
          }
        );

    })
    .catch((err) => console.log(err));
});



router.get("/getstatsfileuploadtoserver/:query", (req, res) => {
  const { query } = req.params;
  res.setHeader("Content-Type", "application/json");

  if (query === "admin") {
    var totalfileuploaded = 0;
    var totalfiledelivered = 0;
    var totalfileinvoiced = 0;
    var totalfileinprocess = 0;
    FileUpload_Model.countDocuments({ adminview: true }).then((count) => {
      totalfileuploaded = count;
      FileUpload_Model.countDocuments({ adminview: true, status: 'Delivered' }).then((count) => {
        totalfiledelivered = count;
        FileUpload_Model.countDocuments({ adminview: true, status: 'Invoiced' }).then((count) => {
          totalfileinvoiced = count;
          FileUpload_Model.countDocuments({ adminview: true, status: 'In process' }).then((count) => {
            totalfileinprocess = count;
            res.status(200).json({
              totalfileuploaded,
              totalfiledelivered,
              totalfileinvoiced,
              totalfileinprocess
            });
          });
        });
      });
    });
  } else {
    var totalfileuploaded = 0;
    var totalfiledelivered = 0;
    var totalfileinvoiced = 0;
    var totalfileinprocess = 0;
    FileUpload_Model.countDocuments({ useremail: query }).then((count) => {
      totalfileuploaded = count;
      FileUpload_Model.countDocuments({ useremail: query, status: 'Delivered' }).then((count) => {
        totalfiledelivered = count;
        FileUpload_Model.countDocuments({ useremail: query, status: 'Invoiced' }).then((count) => {
          totalfileinvoiced = count;
          FileUpload_Model.countDocuments({ useremail: query, status: 'In process' }).then((count) => {
            totalfileinprocess = count;
            res.status(200).json({
              totalfileuploaded,
              totalfiledelivered,
              totalfileinvoiced,
              totalfileinprocess
            });
          });
        });
      });
    });
  }
});



router.get("/getusernotificationsfileuploadto/:email", (req, res) => {
  const { email } = req.params;
  res.setHeader("Content-Type", "application/json");
  Notification_Model.find({ useremail: email }).sort({ date: -1 }).limit(8)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

router.get("/getusernotificationsfileuploadto/:email", (req, res) => {
  const { email } = req.params;
  res.setHeader("Content-Type", "application/json");
  Notification_Model.find({ useremail: email }).sort({ date: -1 }).limit(8)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



router.get("/deletefileuploadto/:id", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  FileUpload_Model.findOneAndUpdate(
    { _id: id },
    { adminview: false },
    { useFindAndModify: false }
  )
    .then(() => {
      res.status(200).json("Updated Product");
    })
    .catch((err) => console.log(err));
});



router.get("/getuserallfileuploadedtoserveradmin", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  FileUpload_Model.find({ adminview: true }).sort({ date: -1 })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});




router.get("/deletefileuploadtouser/:id", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "application/json");
  
  FileUpload_Model.findOneAndDelete({ _id: id })
    .then((data) => {
      res.status(200).json("Removed");
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));

});


// Database CRUD Operations
// @POST Request to GET the People
// POST
router.post("/adduserfileto", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const {
    email,
    displayName,
    vat,
    billingaddress
  } = req.body;

  Userfileupload_Model.countDocuments({ email }).then((count) => {
    if (count === 0) {
      const newUserFileUpload = new Userfileupload_Model({
        email,
        displayName,
        vat,
        billingaddress
      });
      newUserFileUpload
        .save()
        .then((data) => {
          res.status(200).json(data._id);
        })
        .catch(
          (err) => {
            console.log(err)
          }
        );
    }
  });
});


router.get("/getuserdetaislfileupload/:email", (req, res) => {
  const { email } = req.params;
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.find({ email })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



router.get("/updateuserfileupload/:email/:vat/:billingaddress", (req, res) => {
  const { email, vat, billingaddress } = req.params;
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.findOneAndUpdate(
    { email },
    { vat, billingaddress },
    { useFindAndModify: false }
  )
    .then(() => {
      res.status(200).json("Updated Product");
    })
    .catch((err) => console.log(err));
});



router.get("/getallusersdatafileupload", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.find({  }).sort({ date: -1 })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});


router.get("/blockuserfileupload/:id", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.findOneAndUpdate(
    { _id: id },
    { access: false },
    { useFindAndModify: false }
  )
    .then(() => {
      res.status(200).json("Updated Product");
    })
    .catch((err) => console.log(err));
});


router.get("/unblockuserfileupload/:id", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.findOneAndUpdate(
    { _id: id },
    { access: true },
    { useFindAndModify: false }
  )
    .then(() => {
      res.status(200).json("Updated Product");
    })
    .catch((err) => console.log(err));
});


router.get("/getuseraccesspermissionfileupload/:email", (req, res) => {
  const { email } = req.params;
  res.setHeader("Content-Type", "application/json");
  Userfileupload_Model.find({ email }).sort({ date: -1 })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



module.exports = router;